Dicto ao - API for anthropocene playlists
============

<!-- MarkdownTOC -->

- [Local usage][local-usage]
    - [Requirements][requirements]
    - [Installation][installation]
- [Usage][usage]
- [API doc][api-doc]
    - [Entities list][entities-list]
        - [HTTP REQUEST][http-request]
        - [SUCCESS RESPONSE:][success-response]
    - [Single entity][single-entity]
        - [HTTP REQUEST][http-request-1]
        - [SUCCESS RESPONSE:][success-response-1]
    - [Entities network][entities-network]
        - [HTTP REQUEST][http-request-2]
        - [QUERY PARAMETERS][query-parameters]
        - [SUCCESS RESPONSE:][success-response-2]
    - [Get chunks][get-chunks]
        - [HTTP REQUEST][http-request-3]
        - [SUCCESS RESPONSE:][success-response-3]
    - [List videos][list-videos]
        - [HTTP REQUEST][http-request-4]
        - [SUCCESS RESPONSE:][success-response-4]
        - [Single video][single-video]
            - [HTTP REQUEST][http-request-5]
            - [SUCCESS RESPONSE:][success-response-5]
    - [List Playlists][list-playlists]
        - [HTTP REQUEST][http-request-6]
        - [SUCCESS RESPONSE:][success-response-6]
    - [Single playlist][single-playlist]
        - [HTTP REQUEST][http-request-7]
        - [SUCCESS RESPONSE:][success-response-7]

<!-- /MarkdownTOC -->


<a name="local-usage"></a>
## Local usage

<a name="requirements"></a>
### Requirements

* install [node and npm](https://nodejs.org/en/)
* install [yeoman](http://yeoman.io/) - npm install -g yo

Or if you don't want to install yeoman :
* install [Grunt](http://gruntjs.com/) - npm install -g grunt-cli
* install [bower](http://bower.io/) - npm install -g bower

<a name="installation"></a>
### Installation

Download and unpack the repo, open a terminal and cd to its root directory, then :
```
npm install -u
bower install -u
```

That's it !

<a name="usage"></a>
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

<a name="api-doc"></a>
## API doc

API PROPOSAL

<a name="entities-list"></a>
### Entities list

Returns json data about all entities in our corpus

<a name="http-request"></a>
###### HTTP REQUEST

`GET http://www.dictosite.org/api/entities`

<a name="success-response"></a>
###### SUCCESS RESPONSE:

```
{
  'themes':
    [
      { 'name' : 'agriculture', 'value' : 20, id:'theme-agriculture' },
      { 'name' : 'chemicals', 'value' : 8, id:'theme-chemicals' },
      ...
    ],
  'speakers':
    [
      { 'name' : 'Gabibbo', 'value' : 20, id:'speaker-gabibbo' },
      { 'name' : 'Fantozzi', 'value' : 2, id:'speaker-fantozzi'},
      ...
    ],
  'places':
    [
      { 'name' : 'Rionero in Vulture', 'value' : 2, id:'place-rionero-in-vulture' },
      { 'name' : 'Ortona', 'value' : 20, id:'place-ortona' },
      ...
    ]
}
```

Notes on data :
* 'value' attribute corresponds to the total number of occurence of an entity
* 'id' attribute is a slug build with : entity's type + '-' + slugified name

<a name="single-entity"></a>
### Single entity

Returns json data about all video chunks containing the entity

<a name="http-request-1"></a>
###### HTTP REQUEST

`GET http://www.dictosite.org/api/entities/:id`

<a name="success-response-1"></a>
###### SUCCESS RESPONSE:

```
{
  'name':'agriculture',
  'id':'theme-agriculture',
  'chunks':
    [
      { 
        'videoId' : 'an-incredible-story',
        'videoTitle': 'an incredible story',

        'id' : 'an-incredible-story-12',
        'start':20,
        'end' : 32,
        'duration': 12,

        'content' : 'this is the content of the chunk',
        'speakers': [
            {
              'name': 'Nebojsa Nakicenovic',
              'id': 'speaker-nebojsa-nakicenovic'
            },
            {
              'name': 'Jan Zalasiewicz',
              'id': 'speaker-jan-zalasiewicz'
            },
            ...
          ],
        'themes':[
              {
                'name' : 'agriculture',
                'id':'theme-agriculture'
              },
              { 'name' : 'chemicals',
                'id': 'theme-chemicals'
              },
              ...
            ],
        'places': [
            {
              'name' : 'Rionero in Vulture',
              'id':'place-rionero-in-vulture'
            },
            {
              'name' : 'Ortona',
              'id': 'place-ortona'
            },
            ...
          ]
        },
      { 
        'videoId' : 'an-amazing-story',
        'videoTitle': 'an amazing story',

        'id' : 'an-amazing-story-15',
        'start' : 120,
        'end' : 164,
        'duration': 44,
        'content' : 'this is the content of the chunk',
        'speakers': [
            {
              'name': 'Nebojsa Nakicenovic',
              'id': 'speaker-nebojsa-nakicenovic'
            },
            {
              'name': 'Jan Zalasiewicz',
              'id': 'speaker-jan-zalasiewicz'
            },
            ...
          ],
        'themes':[
              {
                'name' : 'agriculture',
                'id':'theme-agriculture'
              },
              { 'name' : 'chemicals',
                'id': 'theme-chemicals'
              },
              ...
            ],
        'places': [
            {
              'name' : 'Rionero in Vulture',
              'id':'place-rionero-in-vulture'
            },
            {
              'name' : 'Ortona',
              'id': 'place-ortona'
            },
            ...
          ]
        },
      ...
    ]
}
```

Notes on data :
* 'value' attribute corresponds to the total number of occurence of an entity
* chunk's 'id' is the slugified title of its origin video + '-' + the (ordinal) position of the chunk in its original video
* tag's 'id' attribute is a slug build with : entity's type + '-' + slugified name
* 'videoId' is built with the slugified title of the video

<a name="entities-network"></a>
### Entities network

Returns json data about the network of one or more entities

<a name="http-request-2"></a>
###### HTTP REQUEST

`GET http://www.dictosite.org/api/network`

<a name="query-parameters"></a>
###### QUERY PARAMETERS

|Parameter|Type|Example|Description|
|---|---|---|---|
|nodes|Array|[20, 12,34]|List of entities id in the network |


<a name="success-response-2"></a>
###### SUCCESS RESPONSE:

```
{
  'nodes':
    [
      {
        'id' : 4,
        'name' : 'agriculture',
        'value' : 20,
        'category' : 'theme'
      },
      {
        'id' : 20,
        'name' : 'chemicals',
        'value' : 2,
        'category' : 'theme'
      },
      ...
    ],
  'links':
    [
      {
        'source' : 4,
        'target' : 20,
        'value' : 2
      },
      ...
    ]
}
```

Notes on data's nodes :
* 'value' attribute corresponds to the total number of occurence of an entity
* entity's 'id' attribute corresponds to the order of the tag in nodes' array (not the same as other endpoints)
* entity's category is the category of entity (theme || speaker || place)

Notes on data's links :
* 'value' attribute is calculated by counting co-occurences of entities within the same chunk

<a name="get-chunks"></a>
### Get chunks

Returns json data with either (if no id specified) all available chunks, or (if an id is specified) the info of the chunk

<a name="http-request-3"></a>
###### HTTP REQUEST

`GET http://www.dictosite.org/api/chunks/:id?`

<a name="success-response-3"></a>
###### SUCCESS RESPONSE:

```
{
  'id' : 'an-amazing-story-15',

  'videoTitle': 'an amazing story',
  'videoId' : 'an-amazing-story',
  'videoSubtitles': 'path/to/an-amazing-story.json',

  'start' : 120,
  'end' : 164,
  'duration': 44,

  'content' : 'Here is the content of the chunk',
  'speakers': [
      {
        'name': 'Nebojsa Nakicenovic',
        'id': 'speaker-nebojsa-nakicenovic'
      },
      {
        'name': 'Jan Zalasiewicz',
        'id': 'speaker-jan-zalasiewicz'
      },
      ...
    ],
  'themes':[
        {
          'name' : 'agriculture',
          'id':'theme-agriculture'
        },
        { 'name' : 'chemicals',
          'id': 'theme-chemicals'
        },
        ...
      ],
  'places': [
      {
        'name' : 'Rionero in Vulture',
        'id':'place-rionero-in-vulture'
      },
      {
        'name' : 'Ortona',
        'id': 'place-ortona'
      },
      ...
    ]
}
```

Notes on data :
* 'value' attribute corresponds to the total number of occurence of an entity
* tag's 'id' attribute is a slug build with : entity's type + '-' + slugified name
* 'videoId' is built with the slugified title of the video

<a name="list-videos"></a>
### List videos

Returns json data with the info of all videos

<a name="http-request-4"></a>
###### HTTP REQUEST

`GET http://www.dictosite.org/api/videos/:id`

<a name="success-response-4"></a>
###### SUCCESS RESPONSE:

```
[
  {

    'videoId' : 'an-amazing-story',
    'videoTitle': 'an amazing story',
    'videoSubtitles': 'path/to/an-amazing-story.json'

    'duration': 560,
    'speakers': [
        {
          'name': 'Nebojsa Nakicenovic',
          'id': 'speaker-nebojsa-nakicenovic'
        },
        {
          'name': 'Jan Zalasiewicz',
          'id': 'speaker-jan-zalasiewicz'
        },
        ...
      ],
    'themes':[
          {
            'name' : 'agriculture',
            'id':'theme-agriculture'
          },
          { 'name' : 'chemicals',
            'id': 'theme-chemicals'
          },
          ...
        ],
    'places': [
        {
          'name' : 'Rionero in Vulture',
          'id':'place-rionero-in-vulture'
        },
        {
          'name' : 'Ortona',
          'id': 'place-ortona'
        },
        ...
      ]
  },
  ...
]
```

<a name="single-video"></a>
#### Single video

Returns json data with the info of the video

<a name="http-request-5"></a>
###### HTTP REQUEST

`GET http://www.dictosite.org/api/videos/:id`

<a name="success-response-5"></a>
###### SUCCESS RESPONSE:

```
{

  'videoId' : 'an-amazing-story',
  'videoTitle': 'an amazing story',
  'videoSubtitles': 'path/to/an-amazing-story.json'

  'duration': 560,
  'speakers': [
      {
        'name': 'Nebojsa Nakicenovic',
        'id': 'speaker-nebojsa-nakicenovic'
      },
      {
        'name': 'Jan Zalasiewicz',
        'id': 'speaker-jan-zalasiewicz'
      },
      ...
    ],
  'themes':[
        {
          'name' : 'agriculture',
          'id':'theme-agriculture'
        },
        { 'name' : 'chemicals',
          'id': 'theme-chemicals'
        },
        ...
      ],
  'places': [
      {
        'name' : 'Rionero in Vulture',
        'id':'place-rionero-in-vulture'
      },
      {
        'name' : 'Ortona',
        'id': 'place-ortona'
      },
      ...
    ]
  }
```


<a name="list-playlists"></a>
### List Playlists

Returns list of playlists represented by their metadata

<a name="http-request-6"></a>
###### HTTP REQUEST

`GET http://www.dictosite.org/api/playlists`

<a name="success-response-6"></a>
###### SUCCESS RESPONSE:

```
[
  {
    'id': 'about-agriculture',
    'title' : 'About agriculture',
    'speakers': [
        {
          'name': 'Nebojsa Nakicenovic',
          'id': 'speaker-nebojsa-nakicenovic'
        },
        {
          'name': 'Jan Zalasiewicz',
          'id': 'speaker-jan-zalasiewicz'
        },
        ...
      ],
    'themes':[
          {
            'name' : 'agriculture',
            'id':'theme-agriculture'
          },
          { 'name' : 'chemicals',
            'id': 'theme-chemicals'
          },
          ...
        ],
    'places': [
        {
          'name' : 'Rionero in Vulture',
          'id':'place-rionero-in-vulture'
        },
        {
          'name' : 'Ortona',
          'id': 'place-ortona'
        },
        ...
      ]
  },
  ...
]
```

<a name="single-playlist"></a>
### Single playlist

Returns metadata and chunks of a given playlist

<a name="http-request-7"></a>
###### HTTP REQUEST

`GET http://www.dictosite.org/api/playlists/:id`

<a name="success-response-7"></a>
###### SUCCESS RESPONSE:

```
{
  'id': 'about-agriculture',
  'title' : 'About agriculture',
  'chunks':[
      {
        'id' : 'an-amazing-story-15',

        'videoTitle': 'an amazing story',
        'videoId' : 'an-amazing-story',
        'videoSubtitles': 'path/to/subtitles.json',

        'start' : 120,
        'end' : 164,
        'duration': 44,

        'content' : 'Here is the content of the chunk',
        'speakers': [
            {
              'name': 'Nebojsa Nakicenovic',
              'id': 'speaker-nebojsa-nakicenovic'
            },
            {
              'name': 'Jan Zalasiewicz',
              'id': 'speaker-jan-zalasiewicz'
            },
            ...
          ],
        'themes':[
              {
                'name' : 'agriculture',
                'id':'theme-agriculture'
              },
              { 'name' : 'chemicals',
                'id': 'theme-chemicals'
              },
              ...
            ],
        'places': [
            {
              'name' : 'Rionero in Vulture',
              'id':'place-rionero-in-vulture'
            },
            {
              'name' : 'Ortona',
              'id': 'place-ortona'
            },
            ...
          ]
      },
      ....
  ]
}
```


