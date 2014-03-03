# The Pointrel/Twirlip project

### DISCLAIMER: This version of the Pointrel System is still an alpha-level exploratory work in progress...

## Overview        

The Pointrel/Twirlip project pair is an experimental step towards a FOSS social semantic desktop for Public Intelligence and Civic Sensemaking.
It aspires to support having a [FreedomBox-inspired](http://lists.alioth.debian.org/pipermail/freedombox-discuss/2011-February/000401.html) "private cloud"
either on either shared hosting or on an inexpensive server such as a "MyBook Live" box or similar low-end device under local control.
Hopefully it will eventually support federating those private clouds as desired into something bigger.

There are two levels to this system -- the underlying Pointrel System and the co-evolving Twirlip information clouds above.
This git repository is about the "Pointrel System" part of that pair.

The base infrastructure level is called the "Pointrel System", and deals with low-level data -- storing it, retrieving it, and indexing it.
That level could potentially be implemented in a variety of way.
Previous versions in a variety of languages are on SourceForge [here](http://sourceforge.net/projects/pointrel/).
The most recent alternative version in Java for the client and PHP for the server is on GitHub [here](https://github.com/pdfernhout/Pointrel20120623).
The version you are looking at uses JavaScript/HTML/CSS for the client and PHP for the server and is on GitHub [here](https://github.com/pdfernhout/Pointrel20130202). 

The upper level is called "Twirlip" and represents applications, content, processes, and users that (hopefully) support collective civic sensemaking
in a co-evolutionary way. That level is largely unfinished at this point. It is the hope to collectively build it using the Pointrel tools here as its base.

## Conceptual overview

The Pointrel System currently supports these services:

* Permanently archiving files retrievable by their SHA-256 hash, size, and extension.
* Automatically creating indexes of some of those files that are in JSON with a specific indexing field and a specific extension.
* Copying specific resources into a web-server accessible location and giving them new names (the "publish" part).
* Adding to user-created append-only journal files
* Changing "variables" which are tags that refer to some specific resource

## Major "to do" items:

* some form of authentication (other than just the always possible .htpasswd).
* creating better base apps for general content creation for a semantic web (inspired by Ward's-Wiki discussions, Drupal, Squeak, PataPata, Augment, Memex, and more);
* creating better "Twirlip" community-oriented issue-focused discussion apps (including ones with ideas inspired by Compendium/Cohere, ProCon, Slashdot, Rakontu, Angler, SEAS, RAHS, PhiBetaIota, Analyst, and more, as well as educational simulations especially on socioeconomic policy topics, like discussed in SimulChaord),
* adding server-side indexing and querying of stored data in an archive (like CouchDB and Map/Reduce) [Some limited support added 2014-02-23],
* improving server-side versioning support for variables and related logging,
* rethinking what a "pointrel:" URL means and what its format is,
* figuring out how a bunch of repositories can form a "federation",
* figuring out how to copy just a small part of a repository from one to another,
* triple store support similar to previous Pointrel software versions,
* push notifications,
* thinking through better what publishing to HTML means,
* lots of other things.

## Licensing

The Pointrel System is Copyright 1983-2014 by Paul D. Fernhout and contributors. 

Please note that "Pointrel" is a trademark of Paul D. Fernhout and the trademark's use is covered by usage guidelines.

This version of the Pointrel System is released under the GNU Lesser General Public License (LGPL) version 3 (or any later version). See this [link](http://www.gnu.org/copyleft/lesser.html) for the license details.

Note that some files under the "libs" directory are covered by other FOSS licenses.

## Installation

To use the Pointrel software, copy it to a web server supporting PHP.
The directory structure should like this (unless you make changes to pointrel_config.php which specifies these directory names).
Note that "yoursite" is located somewhere on your webserver directory.

        /yoursite  (the contents of the pointrel directory of this project go here)
        /yoursite/pointrel-app
        /yoursite/pointrel-data
        /yoursite/pointrel-data/indexes
        /yoursite/pointrel-data/journals
        /yoursite/pointrel-data/logs
        /yoursite/pointrel-data/resources
        /yoursite/pointrel-data/variables
        /yoursite/pointrel-www

Make sure the "pointrel-data" and the "pointrel-www" directory is writeable by your web server process. 
Making directories writeable generally requires using a "chown" command to change ownership such as:

        chown -R www pointrel-data

On a Mac, you may have to use "_www" instead of "www". Or the new file owner name needed there may be different for your system, like "apache" or "www-data".
There are also security issues to consider when changing ownership of files on shared hosting.
Consult your webserver documentation for more details on file ownership and security issues.

If your site is public or otherwise allows use by non-trusted users, you should have a .htaccess file like so (for Apache)
in the /yoursite/pointrel-www directory and pointrel-data directory to prevent executing uploaded cgi scripts (like .php files).
You might need another approach with a different web server like lighttpd.
Such .htaccess files are included already in those directories currently, but double check that they are there if needed.
The server-side publishing script currently checks if a user is trying to write a .htaccss file and will disallow that, so such a file should not be overwriteable by a client
Of course, if you have a private site, like on a local web server, you may want to change the .htaccess file for the pointrel-www directory so you can work on and publish server-side scripts.
Perhaps a future version of the system will have fine-grained authorization to allow only specifcally authorized users to create or change server-side scripts. 

        # Example .htaccess file for Apache to prevent server-side cgi scripts from running
        # disable any cgi in this directory or subdirectories (for Apache, other servers might need something different)
        <Files *>
            SetHandler default-handler
        </Files>
  
You could also add the following to the pointrel-data directory .htaccess file (or to various subdirectiories)
depending on whether you are willing to permit web crawling or alternative access to data files via the web server outside of the server scripts.

        # To possibly add to pointrel-data/.htaccess to prevent direct access to resources, logs, journals, indexes, and variables (for Apache)
        order deny,allow
        deny from all

That .htaccess option would prevent people from reading resources directly, however the server scripts could still access the data.
One reason not to disallow access is so that places like the Internet Archive could crawl your site and potentially (someday)
aggregate this information into a global social semantic desktop.

You must also enable JavaScript in your web browser to use the applications.

--Paul Fernhout  
http://www.pdfernhout.net/  
"The biggest challenge of the 21st century is the irony of technologies of abundance in the hands of those still thinking in terms of scarcity."