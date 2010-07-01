
Which loads faster? (developer's corner)
========================================

    Users don't care about testing methodology. 
    They just want to know which loads faster.
    So put the pages next to each other, and let them duke it out.

Ok, and we'll put in a link to <http://webpagetest.org> if they want to go
more in-depth. Probably include some kind of Learn More dialog.

## Hacking ##

Everything is client-side, and you can hack and test right from your local
filesystem. Just open the `static` directory and have at it.

## Source Graphics ##

Were done in OmniGraffle.

## Deploying ##

So, I'm not made of money for spare bandwidth and you probably aren't either, 
so let's make everything with a far-future expires header and auto-version all
our static content. We'll do this by appending the SHA1 hash of each file's
contents to its filename so that whenever it changes, the user will be directed
to get the new resource.

There's an example configuration for apache in `static/.htaccess` that does the
far-future expires.

There is a Makefile to build and static-ify the site. It requires:

 - openssl (for generating file hashes)
 - google's closure compiler (for compiling and minifying javascript)
 - yui compressor (for minifying css)
 - htmltidy (for minifying html)
 - markdown (for generating documentation)

## Contact ##

There's a [mailing list](http://groups.google.com/group/whichloadsfaster), 
which I expect could end up being more user-oriented. I'll create a dev list
if necessary.

You can reach me at <onecreativenerd@gmail.com>.

