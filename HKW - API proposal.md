HKW - API proposal
======


# For all queries : errors

400 > bad request
404 > not found (do you want more informations when this occurs ?)

# Get all files Metadata

## Endpoint

GET root/api/files

## Success data (200)

An object containing nested arrays featuring each type of document (transcription, montage, image) represented by an object containing their metadata.

```
{
    "transcriptions": [
        {
            "type":"transcription",
            "title":"HKW - video 1",
            "slug":"hkw-video-1",
            "mediaUrl":"https://vimeo.com/133750706",
            "sharable":"true",
            "tags":[{
                "name":"Mickey",
                "category":"person",
                "color":"#556dd9"
            }],
            "tagCategories":[
                {
                    "name":"person"
                }
            ]
        }
    ],
    "montages": [
        {
            "type":"montage",
            "title":"Test montage",
            "slug":"test-montage",
            "sharable":"true"
        }
    ],
    "images" : [
      {
            "type":"image",
            "title":"Test image",
            "slug":"test-image"
      }
    ]
}
```

#Get a specific file data

## Endpoint

GET root/api/file/:type/:slug

Parameters:

| Parameter        | Description | Value  | Example |
| ------------- |:-------------:| :-----:| -----:|
| type      | The type of document to retrieve | "transcription" or "montage" or "image" | transcription |
| slug      | slugified name of the document (toLowerCase, spaces become -, accents stripped) | String (slug) | hkw-video-1 |

## Success data (200)

An object containing two properties : metadata and data. The first features all the useful metadata, the second is a list of items in which each object represents a transcription chunk (markdown content, timecodes in and out, tags). Images will only have a metadata object.

Example of a transcription named "Imaginaire américain" :

```
{
     "metadata": {
          "type": "transcription",
          "title": "Imaginaire américain",
          "slug": "imaginaire-amricain",
          "mediaUrl": "https://vimeo.com/122518217",
          "sharable": "true",
          "tags": [
               {
                    "name": "Mickey",
                    "category": "person",
                    "color": "#556dd9"
               }
          ],
          "tagCategories": [
               {
                    "name": "person"
               }
          ]
     },
     "data": [
          {
               "begin": 3.22,
               "end": 8.06,
               "content": "La bande dessinée jouait un rôle formateur",
               "beginSrtFormat": "00:00:03,220",
               "endSrtFormat": "00:00:08,060"
          },
          {
               "begin": 8.06,
               "end": 13.736,
               "content": "dans le journal de Mickey on avait le paysage",
               "beginSrtFormat": "00:00:08,060",
               "endSrtFormat": "00:00:13,736",
               "tags": [
                    {
                         "name": "Mickey",
                         "category": "person",
                         "color": "#556dd9"
                    }
               ],
               "tagCategories": [
                    "person"
               ]
          }
     ]
}
```

# Get a list all tags (of one type)

## Endpoint

GET root/api/tags/:category

Parameters :

| Parameter        | Description | Value  | Example |
| ------------- |:-------------:| :-----:| -----:|
| category      | The category the tags to retrieve in transcriptions and images. "all" gives you everything, other values gives you all the tags related to a specific category | "all" or "theme" or "person" or "place" | theme |


## Success data (200)

An array of objects representing tags. Each tag presents its original data, plus :

* a "featuredIn" array that represents the metadata and number of occurences of the tag within a specific document and 
* a "coPresence" array that represents the other tags that have been attached to common transcription chunks (score + original data)

```
[
    {
        "name": "Mickey",
        "category": "person",
        "color": "#556dd9",
        "occurences" : 5,
        "featuredIn" : [
            {
                "occurences" : 4,
                "document" : {
                                    "type":"transcription",
                                    "title":"HKW - video 1",
                                    "slug":"hkw-video-1",
                                    "mediaUrl":"https://vimeo.com/133750706",
                                    "sharable":"true",
                                    "tags":[{
                                        "name":"Mickey",
                                        "category":"person",
                                        "color":"#556dd9"
                                    }],
                                    "tagCategories":[
                                        {
                                            "name":"person"
                                        }
                                    ]
                                }
            }
        ],
        "coPresence" : [
            {
                "tag" : {
                            "name": "Mickey",
                            "category": "person",
                            "color": "#556dd9"
                        },
                "score" : 4
        ]
    }
]
```

# Get a specific tag data

## Endpoint

GET root/api/tag/:category/:name

Parameters :

| Parameter        | Description | Value  | Example |
| ------------- |:-------------:| :-----:| -----:|
| category      | The category the tags to retrieve in transcriptions and images. "all" gives you everything, other values gives you all the tags related to a specific category | "all" or "theme" or "person" or "place" | place |
| name      | URI encoded name of the tag | String (URI encoded) | San%20Diego |


## Success data (200)

An object that represents a specific tag. See above ("Get a list of all tags") for additionnal data.

```
{
    "name": "Mickey",
    "category": "person",
    "color": "#556dd9",
    "occurences" : 5,
    "featuredIn" : [
        {
            "occurences" : 5,
            "document" : {
                                "type":"transcription",
                                "title":"HKW - video 1",
                                "slug":"hkw-video-1",
                                "mediaUrl":"https://vimeo.com/133750706",
                                "sharable":"true",
                                "tags":[{
                                    "name":"Mickey",
                                    "category":"person",
                                    "color":"#556dd9"
                                }],
                                "tagCategories":[
                                    {
                                        "name":"person"
                                    }
                                ]
                            }
        },
        {
            "occurences" : 5,
            "document" : {
                                "type":"image",
                                "title":"HKW - video 1",
                                "slug":"hkw-video-1",
                                "tags":[{
                                    "name":"Mickey",
                                    "category":"person",
                                    "color":"#556dd9"
                                }],
                                "tagCategories":[
                                    {
                                        "name":"person"
                                    }
                                ]
                            }
        }
    ],
    "coPresence" : [
        {
            "tag" : {
                        "name": "Mickey",
                        "category": "person",
                        "color": "#556dd9"
                    },
            "score" : 4
    ]
}
```

# Get tags co-occurence network

This endpoints provide data of tags co-occurences within transcriptions and images, through a d3-friendly structure. A link is made (or strenghened) if tags happen to be featured in the same transcription chunk or image.

Possible variation : also include co-occurences in the same transcription (and not just in the same transcription chunk).

## Endpoint

GET root/api/tagsnetwork/:category/

Parameters :

| Parameter        | Description | Value  | Example |
| ------------- |:-------------:| :-----:| -----:|
| category      | The category the tags to retrieve in transcriptions. "all" gives you everything, other values gives you all the tags related to a specific category | "all" or "theme" or "person" or "place" | place |


## Success data (200)

An object containing a "nodes" and "links" array. 

The "nodes" array is composed of objects representing tags, to which is added an "occurences" properties that represents the number of times this tag has been attached in transcription chunks of images.

The "links" array is composed of objects representing source and target of links, and their "strength" (computed from the number of co-occurences).

```
{
    "nodes" : [
        {
            "name": "Mickey",
            "category": "person",
            "color": "#556dd9",
            "occurences" : 5
        }
    ],
    "links" : [
        {
            "source" : 0,
            "target" : 1,
            "value" : 3
        }
    ]
}
```
