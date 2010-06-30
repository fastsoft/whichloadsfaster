.SUFFIXES: .min.js .js .min.css .css .png .static.png
.PHONY: all clean docs

CLOSURE_CMD = closure # Replace this with how you invoke closure

STATIC = static
BUILD = whichloadsfaster

# This generates a list of all the included javascript files
SCRIPTS := `sed -n -e 's/.*src="\(.*.js\)".*/$(STATIC)\/\1/p' < $(STATIC)/index.html`
TARGET_PNGS := `sed -n -e 's/.*src="\(.*.png\)".*/$(BUILD)\/\1/p' < $(STATIC)/index.html`

all: docs $(BUILD) $(BUILD)/js/all.min.js $(BUILD)/css/screen.min.css
clean: docs.clean
	rm -rf $(BUILD)

docs: README.html
docs.clean: README.html
	rm -f $?

$(BUILD):
	cp -r $(STATIC)/ $(BUILD)/

README.html: README.markdown
	markdown $? -f $@

dist:
	# Creating distribution archive
	tar -cvf dist.tar whichloadsfaster
	cp dist.tar dist.tmp.tar
	gzip dist.tar
	SHA1=`openssl sha1 dist.tmp.tar | cut -d' ' -f2`; mv dist.tar.gz whichloadsfaster.$${SHA1}.tgz; echo "\nCreated whichloadsfaster.$${SHA1}.tgz\n"; rm dist.tmp.tar 

#
# Aggregate scripts into all.js
#
$(BUILD)/js/all.js: $(STATIC)/index.html $(STATIC)/js/*.js
	# Concatenate all the javascript
	cat $(SCRIPTS) > $@
	# Replace the script block with a reference to all.js
	cat $(BUILD)/index.html | sed -e '/<!--JAVASCRIPT-->/,/<!--END JAVASCRIPT/ {/<script/d;}'\
    -e 's/<!--JAVASCRIPT-->/<script type="text\/javascript" src="js\/all.js"><\/script>/g' \
    -e '/<!--END JAVASCRIPT/d' > $(BUILD)/index.tmp.html
	mv $(BUILD)/index.tmp.html $(BUILD)/index.html

#
# General rules for building minified, static content using SHA1 of the
# content to make filenames
#
.js.min.js:
	# Compile the js 
	$(CLOSURE_CMD) --js $< --js_output_file $@
	# Take the SHA1 and put it into the filename, then modify main document
	SHA1=`openssl sha1 $< | cut -d' ' -f2`;\
    cp $@ $*.$${SHA1}.min.js; \
	cat $(BUILD)/index.html | sed s/$(<F)/$(*F).$${SHA1}.min.js/g > $(BUILD)/index.tmp.html
	mv $(BUILD)/index.tmp.html $(BUILD)/index.html

.css.min.css:
	# TODO: Compile and minify CSS
	cp $< $@
	# Take the SHA1 and put it into the filename, then modify main document
	SHA1=`openssl sha1 $< | cut -d' ' -f2`;\
    cp $@ $*.$${SHA1}.min.css; \
	cat $(BUILD)/index.html | sed s/$(<F)/$(*F).$${SHA1}.min.css/g > $(BUILD)/index.tmp.html
	mv $(BUILD)/index.tmp.html $(BUILD)/index.html

.png.static.png:
	cp $< $@
	# Take the SHA1 and put it into the filename, then modify main document and css
	SHA1=`openssl sha1 $< | cut -d' ' -f2`;\
    cp $@ $*.$${SHA1}.static.png; \
	cat $(BUILD)/index.html | sed s/$(<F)/$(*F).$${SHA1}.static.png/g > $(BUILD)/index.tmp.html
	mv $(BUILD)/index.tmp.html $(BUILD)/index.html

