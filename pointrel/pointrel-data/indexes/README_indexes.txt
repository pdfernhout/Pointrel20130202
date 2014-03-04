This is where the index files will be stored.

Indexes are append-only files which store references to all resources with a certain extension (".pce.json")
and which specify one or more indexes in the json using a top-level entry for "_pointrelIndexing".
These json resources can be seen as being a "piece" of a larger hyperdocument.

An example of json that would be indexed if stored in a resource with an extension ending in ".pce.json" is:

    {"_pointrelIndexing":["chat-indexed:test-001"],"timestamp":"2014-02-26T22:14:29.950Z","userID":"tester@example.com","message":"a test chat message"}

Indexes are similar to user journals except they are created by the system and have a well-defined format.
That format is a sequence of JSON objects which represent index entries.