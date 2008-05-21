#!/bin/bash

builddir=../build
destfile=readeroo.xpi
tmpzip=readerootmp.zip
if [ ! -d $builddir ]; then mkdir $builddir; fi 
if [ -a $builddir/$destfile ]; then rm $builddir/$destfile; fi
zip -r $builddir/$tmpzip . -x *.svn* BUILD
mv $builddir/$tmpzip $builddir/$destfile
