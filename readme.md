Dicto - the transcription editing & soft-cutting companion
============

## About

Dicto is a playground for manipulating online media files through timecoding, transcription, and remix. 
It is initially a tool aimed at improving and facilitating the usage of interviews or conference footages in journalistic, academic or educational contexts.

It supports two types of activities :
* the production and refining of "**transcriptions**" : a video or audio media document accompanied with timecoded text and tags. It can be used for casual subtitling and transcription, commenting, or analytic tagging.
* the production and sharing of "**montages**", which are documents merging a series of transcription excerpts and various external contents (text, image, ...) into a linear, sharable narrative.

Dicto is the outcome of a design research process, and is being developed in a digital humanities research context by Robin de Mourat (Université Rennes 2, Rennes) and Donato Ricci (SciencesPo, Paris).

## Features

* a specific - mouse, touch, and keyboard friendly - interface for transcription refining and timecoding
* a rich transcription editing tool through markdown language, allowing to simply format text and add images and hyperlinks to your transcriptions
* advanced tagging functionnalities, allowing complex analysis through tag categorization and visualization
* diversified import and export possibilities : srt (subtitles), txt (plain text), csv (table), json (javascript-friendly)

* a simple drag-and-drop soft-cutting interface that will allow you to make "montages" by assembling and remixing existing pieces of transcripted media

* diverse sharing possibilities - as stand-alone linkable webpages or embed code


## Roadmap

* deployment as a SaaS - with user system and drive-like documents permissions
* advanced metadata handling for academic use and referencing
* "multi-faceted" chunks and multi-threaded transcriptions, to allow several layers of transcription, inspred by [Lignes de temps](http://www.iri.centrepompidou.fr/outils/lignes-de-temps/)-like software
* chunks commenting functionnalities
* advanced sharing options (video transitions, css styling) and diversifed modes (as visualization, as tag-base threads, ...)
* keyboard shortcuts handling
* integration of new media sources (youtube, soundcloud, ...)
* documented public API for third-party use

### Wishlist (collaborations wanted!)

* interfacing with automatic speech recognition modules
* on-the-fly video building and export, in [videogrep style](https://github.com/antiboredom/videogrep)

## Local usage

### Requirements

* install [node and npm](https://nodejs.org/en/)
* install [yeoman](http://yeoman.io/) - npm install -g yo

Or if you don't want to install yeoman :
* install [Grunt](http://gruntjs.com/) - npm install -g grunt-cli
* install [bower](http://bower.io/) - npm install -g bower

### Installation

Download and unpack the repo, open a terminal and cd to its root directory, then :
```
npm install
bower install
```

That's it !

## Usage

Development :
```
grunt serve
```

Production :
```
grunt build
cd dist
```
