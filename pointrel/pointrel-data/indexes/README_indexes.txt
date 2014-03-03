This is where the index files will be stored.

Indexes are append-only files which store references to all resources with a certain extension (.json-pi)
and which specify one or more indexes in the json. They are similar to user journals except they are 
created by the system and have a well-defined format (a sequence of JSON objects which represent index entries).