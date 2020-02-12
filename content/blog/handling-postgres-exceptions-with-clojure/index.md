---
title: 👩‍💻 Handling Postgres exceptions with Clojure
date: "2020-02-12"
description: "TL;DR You can dig out Postgres exception codes in your Clojure app using getSQLState."
---

> TL;DR You can dig out Postgres exception codes in your Clojure app using getSQLState.

Today I had to add error handling for some DB operations in a Clojure project I'm working on, and it took me some time to figure out how to get the error code from Postgres.

### Reading the docs

My initial research pointed to the following methods that are available in Clojure for managing exceptions. They all come from Java.

- `public String getMessage()`: Returns a detailed message about the exception that has occurred
- `public Throwable getCause()`: Returns the cause of the exception as represented by a Throwable object
- `public String toString()`: Returns the name of the class concatenated with the result of `getMessage()`

I could get the error message using them but not the error code Postgres returned.

For example, `toString` returned the following:

```
java.sql.BatchUpdateException: Batch entry 0 DELETE FROM table-name WHERE id = 'd660bfb0_4dbf_11ea_baa2_0242c0a82002'::uuid was aborted:
ERROR: invalid input syntax for type uuid: "d660bfb0_4dbf_11ea_baa2_0242c0a82002"
Call getNextException to see other errors in the batch.
```

(If this message makes no sense and you are curious, I was trying to delete a record using the column `id` which is of type [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier). The error handling I was adding was for the scenario where the input UUID was malformed.)

### Why the error message is not enough

I didn't want to throw the message as is because that might leak internal details to the calling app. Instead I wanted to catch and rethrow the error with a sanitized message.

Using these methods I would have to parse the error message text, which is not exactly a bullet-proof implementation.

I needed a way to get the error code. In this specific case I wanted to get the [Postgres error codes](https://www.postgresql.org/docs/12/errcodes-appendix.html).

### How to get the error code

The java docs pointed to the [getErrorCode](https://docs.oracle.com/javase/8/docs/api/java/sql/SQLException.html?is-external=true#getErrorCode--) method, but for some reason it returned the value `0`.

Finally, I got what I wanted using the [getSQLState](https://docs.oracle.com/javase/8/docs/api/java/sql/SQLException.html#getSQLState--) method.

The following snippet defines a function that takes as input a DB object and the Id of a record to delete from table `table-name`. If the transaction fails, it checks the error code and returns an error message to the calling function.

```clojure
(defn delete-record!
  "Delete a record by id."
  [db-spec id]
  (try
    (jdbc/with-db-transaction [_ db-spec]
      (jdbc/delete! db-spec :table-name ["id = ?::uuid" id]))
    (catch java.sql.BatchUpdateException e
      (case (.getSQLState e)
        "22P02" (str "Invalid input syntax for id: " id)
        "42P01" (str "Table table-name does not exist")
        "24000" (str "Invalid cursor state")
        ;keep adding error codes here
        (str "Something bad happened"))))
    (catch Exception e
      (throw (Exception. "my exception message")))))
```

This worked fine for my case.

### Log more info for debugging

Since often the error messages I return are not the most useful for debugging, I added another function that logs detailed information. In the snippet below you can see a version of this function that prints this info to the output stream. You can replace that with the logging of your preference.

```clojure
(defn log-sql-exception
  "Logs the contents of an SQLException"
  [^SQLException exception]
  (let [^Class exception-class (class exception)]
    (println
     (format (str "%s:" \newline
                  " Message: %s" \newline
                  " SQLState: %s" \newline
                  " Error Code: %d")
             (.getSimpleName exception-class)
             (.getMessage exception)
             (.getSQLState exception)
             (.getErrorCode exception)))))
```

Note that you will have to `(:import (java.sql SQLException))` in your namespace for this code to work.

### Resources

Some of the resources I used to figure this out:

- The most helpful of all was reading the code of [jdbc.clj](https://github.com/clojure/java.jdbc/blob/master/src/main/clojure/clojure/java/jdbc.clj), the Clojure interface to sql databases via jdbc. Highly recommended if you are working with Clojure and any DB (not only Postgres)
- [Clojure - Exception Handling](https://www.tutorialspoint.com/clojure/clojure_exception_handling.htm): an intro to Clojure error handling
- Reference docs for [Java class SQLException](https://docs.oracle.com/javase/8/docs/api/java/sql/SQLException.html)
- Reference docs for [Postgres Error Codes](https://www.postgresql.org/docs/12/errcodes-appendix.html)
