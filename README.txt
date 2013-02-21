This version of the Pointrel System is released under the GNU Lesser General Public License (LGPL) version 3 (or any later version). See this link for the license details:
http://www.gnu.org/copyleft/lesser.html

To use this software, copy it to a web server supporting PHP. You also need to make a few directories to get a directory structure that looks like this (unless you make changes to pointrel_config.php). Note that "yoursite" is located somewhere on your webserver directory.

  /yoursite
  /yoursite/pointrel-app
  /yoursite/pointrel-data
  /yoursite/pointrel-www

Make sure the "pointrel-data" directory is writeable by your web server process.  Making that directory writeable generally requires using a "chown" command to change ownership such as:

  chown -R www pointrel-data

On a Mac, you may have to use "_www" instead of "www". Or the new file owner name needed there may be different for your system, like "apache" or "www-data". There are also security issues to consider when changing ownership of files on shared hosting. Consult your webserver documentation for more details.

You should also make sure there is a .htaccess file in the pointrel-data directory which reads:

  order deny,allow
  deny from all

That .htaccess file is needed to prevent people from reading resources directly or running any uploaded scripts like .php files. You may need a different sort of file if you are running a different sort of web server like lighttpd.

You must also enable JavaScript in your web browser to use the applications. An initial starter set of test data is provided. That data is provided under a Creative Commons CC-BY-SA license.

Please note that "Pointrel" is a trademark of Paul Fernhout and the trademark's use is covered by useage guidelines.

Note that some files under the "js" directory may be covered by other licenses.
