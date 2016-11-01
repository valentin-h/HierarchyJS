#HierarchyJS 0.1

##A content-based javascript library that generates HTML

HierachyJS allows you to get an HTML structure based on the data you give.

1. Configure your sections
2. Add content to sections and indicate each content importance in the section
3. The library determine the best layout for each section of your content<br/>
-> Your HTML structure is ready !

###License
Released under the MIT license - http://opensource.org/licenses/MIT

##Installation

###Step 1: Link required files

jQuery needs to be included before HierarchyJS :

```html
<!-- jQuery library (served from Google) -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
<!-- HierarchyJS -->
<script src="/scripts/jquery.hierarchy.min.js"></script>
```

Hierarchy add classes to the html tags.<br/>
You can include the css file to get a default formatted layout or you can write your own css :

```html
<!-- Hierarchy CSS file (optional) -->
<link href="/css/hierarchy.css" rel="stylesheet" />
```

###Step 2: Prepare your data

All your sections and contents must be regrouped in a general array of object as following :

```javascript
    var data = [
        {
            name:'new section',
            content:[
                {type:'image', data:'images/img.jpg', priority:3},
                {type:'text', data:'title', priority:3},
            ]
        }
    ];
```

Note that each object in the global array represents a section in the HTML output.<br/>
Moreover, each object in the content array represents a content for the concerned section.

Find more details on the object below.

###Step 3: Call the Hierarchy

Call the constructor then call the getHTML method with data and options :

```javascript
    var data = [
        {
            name:'new section',
            content:[
                {type:'image', data:'images/img.jpg', priority:3},
                {type:'text', data:'title', priority:3},
            ]
        }
    ];
    var hierarchy = new Hierarchy();
    var html = hierarchy.getHTML(data, options);

    // do what you want with your html
```

## Data array overview

### Sections

Each object of the general data array will ouput section open / close tags with each content included

**name** {string} - name of the section<br/>
**content** {array} - array with object for each content<br/>

### Contents

Each object represents a content

**type** {string} - type of the content

This can be an image :

```
    type:'image'
```

or a text :

```
    type:'text'
```

Other types of content like audio or video are not yet supported.

**data** {string} - the content

If type is string, data must be a string :

```
    type:'text',
    data:'lorem ispum dolor sit amet'
```

If type is image, data can be a local path :
```
    type:'image',
    data:'images/img.jpg'
```

A distant url :
```
    type:'image',
    data:'http://www.domain.com/img.jpg'
```

Or HTML5 File Object (useFileAPI option must be set to true, see below) :
```
    type:'image',
    data:{}
```

You can use an input type="file" to generate HTML5 File Object (see examples folder).

**priority** {integer} - importance of the content

Must be between **1** and **3** (3 as the most important).

This will basically determine the order of your content in the HTML output.


## Options

**addTags** {boolean}<br/>
**default:** false<br/>
If set to true the HTML output will contain doctype and head tags.

**addMenu** {boolean}<br/>
**default:** true<br/>
If set to true a header menu will be generated with link to each sections.<br/>
**Note** : The menu appears when you have 2 or more sections.

**useFileAPI** {boolean}<br/>
**default:** false<br/>
If set to true you will be able to use HTML5 File API to upload images from an input type file.<br/>
**Note** : The getHTML() method returns now a promise as following :

```javascript
    hierarchy.getHTML(data, {
        useFileAPI:true,
    }).then(function(html){
        // do what you want with html here
    });

```

## Examples

Please see the examples folder

