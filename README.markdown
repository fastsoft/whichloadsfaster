
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
our static content. To make this as painless as possible, I'm requiring `make`
and python.

There's an example configuration for apache in `static/.htaccess` for far-future
expires.

There will also be a Makefile to build the static pages 
(when I get around to it).

