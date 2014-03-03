Pointrel variables go here.

Variables are pointers to a specific resource ID. They can be used by applications to as a key-value store, to associate some name with a current value.
In order to change a variable, you need to supply the previous value.
This is intended to deal with concurrency issues by preventing changing them by an out-of-date client.