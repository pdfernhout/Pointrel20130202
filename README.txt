NOTE: This is still an alpha-level exploratory work in progress...

The biggest "to do" item is some form of authentication. But after that are:
* creating better base apps for general content creation for a semantic web (inspired by Ward's-Wiki discussions, Drupal, Squeak, PataPata, Augment, Memex, and more);
* creating better community-oriented issue-focused discussion apps (including ones with ideas inspired by Compendium/Cohere, ProCon, Slashdot, Rakontu, Angler, SEAS, RAHS, PhiBetaIota, Analyst, and more, as well as educational simulations especially on socioeconomic policy topics, like discussed in SimulChaord),
* adding server-side indexing and querying of stored data in an archive (like CouchDB and Map/Reduce),
* improving server-side versioning support for variables and related logging,
* rethinking what a "pointrel:" URL means and what its format is,
* figuring out how a bunch of repositories can form a "federation",
* figuring out how to copy just a small part of a repository from one to another,
* push notifications,
* thinking through better what publishing to HTML means,
* lots of other things.

--Paul Fernhout
http://www.pdfernhout.net/
====
The biggest challenge of the 21st century is the irony of technologies of abundance in the hands of those thinking in terms of scarcity.

------

The Pointrel System is Copyright 1983-2013 by Paul D. Fernhout and contributors.
Please note that "Pointrel" is a trademark of Paul D. Fernhout and the trademark's use is covered by usage guidelines.

This version of the Pointrel System is released under the GNU Lesser General Public License (LGPL) version 3 (or any later version). See this link for the license details:
http://www.gnu.org/copyleft/lesser.html

Note that some files under the "libs" directory are covered by other FOSS licenses.

To use this software, copy it to a web server supporting PHP. You also need to make a few directories to get a directory structure that looks like this (unless you make changes to pointrel_config.php). Note that "yoursite" is located somewhere on your webserver directory.

  /yoursite
  /yoursite/pointrel-app
  /yoursite/pointrel-data
  /yoursite/pointrel-data/logs
  /yoursite/pointrel-data/resources
  /yoursite/pointrel-data/variables
  /yoursite/pointrel-www

Make sure the "pointrel-data" and the "pointrel-www" directory is writeable by your web server process.  Making directories writeable generally requires using a "chown" command to change ownership such as:

  chown -R www pointrel-data

On a Mac, you may have to use "_www" instead of "www". Or the new file owner name needed there may be different for your system, like "apache" or "www-data". There are also security issues to consider when changing ownership of files on shared hosting. Consult your webserver documentation for more details.

You should also make sure there is a .htaccess file in the pointrel-data directory which reads:

  order deny,allow
  deny from all

That .htaccess file is needed to prevent people from reading resources directly or running any uploaded scripts like .php files. You may need a different sort of file if you are running a different sort of web server like lighttpd.

You must also enable JavaScript in your web browser to use the applications.