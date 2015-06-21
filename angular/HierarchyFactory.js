angular.module('platformApp')
    .factory('HierarchyFactory', ['$q', function ($q) {

        return {

            /** --- main variables --- **/

            /**
             * Array of objects
             */
            data: [],

            /**
             * String
             */
            html: '',

            /**
             * Array of objects
             */
            preloads: [],

            /**
             * Integer
             */
            preloaded: 0,

            /**
             * Object
             */
            containers: {},

            /**
             * Array of objects
             */
            injects: [],

            /** --- settings --- **/

            /**
             * Object
             */
            settings: {
                useFileAPI: false,
                addTags: false,
                addMenu: true
            },

            /**
             * @param {Array} data
             * @param {object} settings
             * @returns {string || promise} (depending on setting "useFileAPI")
             */
            getHTML: function (data, settings) {

                // optional parameter
                var options = settings || false;

                // if options, merge default settings with user settings
                if (options) {
                    this.settings = $.extend({}, this.settings, options);
                }

                var self = this;
                this.data = data;

                // parse content and generate sections
                this.parseData();

                // manage contents that must be injected in some element
                this.injectContents();

                // depending on setting "addMenu" value
                if (this.settings.addMenu) {

                    // if at least 2 sections
                    if (this.data.length > 1) {
                        this.injectMenus();
                    }

                }

                // depending on settings "useFileAPI" value
                if (this.settings.useFileAPI) {

                    return $q(function (resolve, reject) {

                        /**
                         *
                         * @param {object} file
                         * @param {string} stamp
                         * asynchronous local loading of images when submited with file input
                         */
                        var loadImage = function (file, stamp) {

                            // parse HTML to dom object
                            var parsed = $.parseHTML(self.html);
                            var entity = $(parsed).find('*[data-stamp="' + stamp + '"]');
                            var img = file;
                            var back = 'url("' + file + '")';
                            var temp = '';

                            // add base64 image to element
                            if ($(entity).is('div')) {
                                $(entity).css('background-image', back);
                            } else if ($(entity).is('img')) {
                                $(entity).attr('src', img);
                            }

                            // parse DOM to HTML string
                            for (var u = 0; u < $(parsed).length; u++) {
                                temp += $(parsed)[u].outerHTML;
                            }

                            self.html = temp;

                            // increase preloaded image number
                            self.preloaded++;

                            if (self.preloaded == self.preloads.length) {

                                // depending on settings "addTags" value
                                if (self.settings.addTags) {

                                    self.injectTags();

                                }

                                resolve(self.html);
                            }

                        };

                        // if images in sections

                        if (self.preloads.length > 0) {

                            // preload each image

                            self.preloads.forEach(function (c, i, a) {

                                var stamp = c.stamp;
                                var file = c.file;

                                // if image is submitted as url
                                if (typeof(file) == 'string') {

                                    loadImage(file, stamp);

                                    // if image is submitted from an input file
                                } else {

                                    var reader = new FileReader();

                                    reader.onloadend = function () {

                                        loadImage(reader.result, stamp);

                                    };

                                    reader.readAsDataURL(file);

                                }

                            });

                            // if no image

                        } else {

                            // depending on settings "addTags" value
                            if (self.settings.addTags) {

                                self.injectTags();

                            }

                            resolve(self.html);

                        }

                    });

                    // if setting "useFileAPI" is false
                } else {

                    // retrieve images
                    this.preloads.forEach(function (c, i, a) {

                        var stamp = c.stamp;
                        var file = c.file;

                        // parse html to DOM object
                        var parsed = $.parseHTML(this.html);
                        var entity = $(parsed).find('*[data-stamp="' + stamp + '"]');
                        var img = file;
                        var back = "url('" + file + "')";
                        var temp = '';

                        // add url to images
                        if ($(entity).is('div')) {
                            $(entity).css('background-image', back);
                        } else if ($(entity).is('img')) {
                            $(entity).attr('src', img);
                        }

                        // parse DOM object to string HTML
                        for (var u = 0; u < $(parsed).length; u++) {
                            temp += $(parsed)[u].outerHTML;
                        }

                        this.html = temp;

                    }, this);

                    return this.html;

                }

            },

            /**
             * parse all submitted sections
             */
            parseData:function () {

                // reset variables for each preview
                this.html = '';
                this.injects = [];
                this.containers = {};
                this.preloads = [];
                this.preloaded = 0;

                // loop through array of sections
                this.data.forEach(function (section, idSection, arraySection) {

                    // slugify and open section tag for each one
                    this.openSectionHTML(this.slugify(arraySection[idSection]['name']), idSection);

                    // this will return an array of 3 array sorted by priority, and with image before text
                    var priorities = this.resolvePriority(section);

                    // -------------------------------------------

                    var pLength = 0;
                    var cLength = 0;
                    var pTypes = [
                        '', // level 3
                        '', // level 2
                        ''  // level 1
                    ];
                    var pContents = [
                        {image: 0, text: 0}, // level 3
                        {image: 0, text: 0}, // level 2
                        {image: 0, text: 0}  // level 1
                    ];

                    // first for each on priorities to determine length of priorities
                    priorities.forEach(function (priority, pId, pArray) {

                        // calculate priority length, if array is empty, stop this iteration with return
                        if (priority.length > 0) {
                            pLength++
                        }

                        var curImg = 0;
                        var curTxt = 0;

                        // first for each  on content to determine types of content
                        priority.forEach(function (content, cId, cArray) {

                            var curType = content['type'];
                            switch (curType) {
                                case 'image':
                                    curImg++;
                                    pContents[pId]['image'] = parseInt(pContents[pId]['image']) + 1;
                                    break;
                                case 'text' :
                                    curTxt++;
                                    pContents[pId]['text'] = parseInt(pContents[pId]['text']) + 1;
                                    break;
                            }

                            cLength++;

                        }, this);

                        // determine major type of current priority
                        if (curImg > 0 && curTxt == 0) {
                            pTypes[pId] = 'image'
                        }
                        if (curImg == 0 && curTxt > 0) {
                            pTypes[pId] = 'text'
                        }
                        if (curImg > 0 && curTxt > 0) {
                            pTypes[pId] = 'mixed'
                        }

                    }, this);

                    // second for each to iterate over each priority, determine types and get content
                    priorities.forEach(function (priority, pId, pArray) {

                        // second foreach to get html for each content
                        priority.forEach(function (content, cId, cArray) {

                            var date = new Date();
                            var stamp = date.getTime() + '-' + idSection + '-' + pId + '-' + cId;

                            // determine content
                            var response = this.determineContent(pId, pLength, cLength, pTypes, pContents, idSection, cId, content, stamp);

                            if (!response.injection.done) {
                                this.html += response.html
                            }


                            // if image, load preview asynchronously
                            if (content['type'] == 'image' && (content['data'] != null) {

                                this.preloads.push({stamp: stamp, file: content['data']});

                            }

                        }, this);

                    }, this);

                    // -------------------------------------------

                    // close section tag for each one
                    this.closeSectionHTML();

                }, this)

            },

            /**
             *
             * @param {object} section
             * @returns {Array}
             */
            resolvePriority: function (section) {

                var priorities = [
                    [], // level 1
                    [], // level 2
                    []  // level 3
                ];

                var temp = {};

                // iterate over each content
                section['content'].forEach(function (content, idContent, arrayContent) {

                    var priority = content['priority'];
                    //var index = parseInt(priority-1);
                    var type = content['type'];

                    // dynamically create object temp depending on content and their priority
                    temp[priority] = temp.hasOwnProperty(priority) ? temp[priority] : {};
                    temp[priority][type] = temp[priority].hasOwnProperty(type) ? temp[priority][type] : [];
                    temp[priority][type].push(content);

                }, this);

                // now object is created, iterate over it and concat general priorities array
                for (var l in temp) {

                    var curImgArr = temp[l].hasOwnProperty('image') ? temp[l]['image'] : false;
                    var curTxtArr = temp[l].hasOwnProperty('text') ? temp[l]['text'] : false;

                    var index = parseInt(l) - 1;

                    if (curImgArr) {
                        curImgArr.forEach(function (c, i, a) {
                            priorities[index].push(c);
                        });
                    }
                    if (curTxtArr) {
                        curTxtArr.forEach(function (c, i, a) {
                            priorities[index].push(c);
                        });
                    }

                }

                return priorities.reverse();

            },

            /**
             *
             * @param {int} idLevel
             * @param {int} pLength
             * @param {int} cLength
             * @param {Array} pTypes
             * @param {Array} pContents
             * @param {int} idSection
             * @param {int} idContent
             * @param {string} content
             * @param {string} stamp
             * @returns {{html: string, injection: {done: boolean, section: *, target: string, html: string}}}
             */
            determineContent: function (idLevel, pLength, cLength, pTypes, pContents, idSection, idContent, content, stamp) {

                var lvl = 3 - parseInt(idLevel); // numeric level
                var type = content['type']; // type of this content
                var data = type == "text" ? content['data'] : ''; // data of this content
                var exists = false;
                var nth, cls;
                var response = {
                    html: '',
                    injection: {
                        done: false,
                        section: idSection,
                        target: '',
                        html: ''
                    }
                };

                // level 3 image takes full section
                if (lvl == 3 && type == 'image') {
                    exists = this.hasContainerOrCreate(idSection, 'hierarchy-3-img-container');
                    if (!exists) {
                        response.html = '<div data-stamp="' + stamp + '" class="hierarchy-3-img-container flex-centered"></div>';
                    }
                }

                // lvl 2
                if (lvl == 2) {

                    // type img
                    if (type == 'image') {

                        // images & text
                        if (pTypes[idLevel] == 'mixed') {

                            // image = text
                            if (pContents[idLevel]['image'] == pContents[idLevel]['text']) {

                                if (pContents[idLevel]['image'] > 1) {

                                    if (idContent % 2 == 0) {
                                        cls = 'float-left ';
                                    } else {
                                        cls = 'float-right ';
                                    }

                                    response.html += '<div class="hierarchy-2-mixed-container"><div data-stamp="' + stamp + '" class="hierarchy-2-mixed-img ' + cls + '"/></div>';

                                } else {

                                    response.html += '<div class="hierarchy-2-img" data-stamp="' + stamp + '"></div>';

                                }

                                // more images than text
                            } else if (pContents[idLevel]['image'] > pContents[idLevel]['text']) {

                                if (idContent == 0) {
                                    response.html += '<ul class="bxslider hierarchy-2-slider"><li><img data-stamp="' + stamp + '" src=""/></li></ul>';
                                } else {
                                    response.html += '<li><img data-stamp="' + stamp + '" src=""/></li>';
                                    response.injection.target = '.hierarchy-2-slider';
                                    response.injection.html = response.html;
                                    response.injection.done = true;
                                    this.injects.push(response.injection);

                                }

                                // more text than images
                            } else {

                            }

                            // images only
                        } else if (pTypes[idLevel] == 'image') {

                            response.html += '<div class="hierarchy-2-img" data-stamp="' + stamp + '"></div>';

                        }

                        // type text
                    } else {

                        if (pTypes[idLevel] == 'mixed') {

                            // text = images
                            if (pContents[idLevel]['image'] == pContents[idLevel]['text']) {

                                // at least 2 images & texts
                                if (pContents[idLevel]['image'] > 1) {

                                    var length = parseInt(pContents[idLevel]['image']) + parseInt(pContents[idLevel]['text']);
                                    var half = length / 2;
                                    var index = (idContent - half);
                                    nth = index + 1;
                                    if (nth < 1) {
                                        nth = 1
                                    }

                                    if (index % 2 == 0) {
                                        cls = 'float-left align-justify-left margin-top-med';
                                    } else {
                                        cls = 'float-right align-justify-right margin-top-med';
                                    }

                                    response.html += '<h2 class="hierarchy-2-mixed-title ' + cls + '">' + data + '</h2>';

                                    response.injection.target = '.hierarchy-2-mixed-container:nth-child(' + nth + ')';
                                    response.injection.html = response.html;
                                    response.injection.done = true;
                                    this.injects.push(response.injection);

                                    // 1 image & 1 text
                                } else {

                                    response.html += '<h2 class="hierarchy-2-title margin-top-high ' + cls + '">' + data + '</h2>';

                                }

                                // more images than texts
                            } else if (pContents[idLevel]['image'] > pContents[idLevel]['text']) {


                                response.html += '<h2 class="hierarchy-2-title margin-top-high ' + cls + '">' + data + '</h2>';

                                // more texts than images
                            } else {

                            }

                        } else if (pTypes[idLevel] == 'text') {

                            response.html += '<h2>' + data + '</h2>';

                        }

                    }


                }

                // lvl 1 text for typology right / left
                if (lvl == 1) {

                    // type text
                    if (type == 'text') {

                        // lvl 2 types is mixed
                        if (pTypes[1] == 'mixed') {

                            // lvl 2 image = lvl 2 text
                            if (pContents[1]['image'] == pContents[1]['text']) {

                                // more than one lvl 2 image
                                if (pContents[1]['image'] > 1) {

                                    nth = idContent + 1;

                                    if (nth % 2 == 0) {
                                        cls = 'align-justify-right float-right ';
                                    } else {
                                        cls = 'align-justify-left float-left ';
                                    }

                                    response.html += '<p class="hierarchy-1-text-injected-in-2-mixed  margin-top-low ' + cls + '">' + data + '</p>';
                                    response.injection.target = '.hierarchy-2-mixed-container:nth-child(' + nth + ')';
                                    response.injection.html = response.html;
                                    response.injection.done = true;
                                    this.injects.push(response.injection);

                                } else {

                                    cls = 'align-justify-left';

                                    response.html += '<p class="hierarchy-1-text margin-top-med ' + cls + '">' + data + '</p>';

                                }

                                // more lvl 2 images than lvl 2 txt
                            } else if (pContents[1]['image'] > pContents[1]['text']) {

                                cls = 'align-justify-left';

                                response.html += '<p class="hierarchy-1-text margin-top-med ' + cls + '">' + data + '</p>';

                            }

                            // lvl 2 types is images
                        } else if (pTypes[1] == 'images') {

                            // lvl 2 types is text
                        }
                        else {

                        }

                        // type image
                    } else {

                    }


                }

                if (lvl == 3 && (pTypes[idLevel] == 'text' || pTypes[idLevel] == 'mixed') && type == 'text') {
                    response.html += '<h1>' + data + '</h1>';
                }


                // if hierarchy-3-img container exists, inject content if not yet injected in something
                if (
                    ((lvl == 1 || lvl == 2) && (pTypes[0] == 'image' || pTypes[0] == 'mixed')) ||
                    (lvl == 3 && type == 'text' && pTypes[0] == 'mixed')
                ) {

                    if (!response.injection.done) {

                        response.injection.target = '.hierarchy-3-img-container';
                        response.injection.html = response.html;
                        response.injection.done = true;
                        this.injects.push(response.injection);

                    }

                }

                return response;

            },

            /**
             *
             * @param {int} idSection
             * @param {string} item
             * @returns {boolean}
             */
            hasContainerOrCreate: function (idSection, item) {

                var exists = false;

                if (this.containers[idSection] == undefined) {
                    this.containers[idSection] = [item];
                } else {
                    exists = true;
                }

                return exists;

            },

            /**
             * Inject contents in already added elements
             */
            injectContents: function () {


                var parsed = $.parseHTML(this.html);
                var html = '';

                this.injects.forEach(function (inj, i, arr) {

                    $(parsed[inj.section]).find(inj.target).append(inj.html);

                });

                for (var i = 0; i < $(parsed).length; i++) {
                    html += $(parsed)[i].outerHTML;
                }

                this.html = html;

            },

            /**
             * Add a menu with link for each section
             */
            injectMenus: function () {

                var prepend = '';

                prepend += '<header><ul id="main-menu">';


                this.data.forEach(function (s, i, a) {

                    if (this.data.length > 1 && ( (i + 1) < this.data.length)) {

                        prepend += '<li><p data-index="' + (i + 1) + '" class="hierarchy-menu-link">' + s.name + '</p></li><li class="menu-picto"> ◘ </li>';

                    } else {

                        prepend += '<li><p data-index="' + (i + 1) + '" class="hierarchy-menu-link">' + s.name + '</p></li>';

                    }


                }, this);

                prepend += '</ul></header>';

                this.html = prepend + this.html;

            },

            /**
             * Add doctype, head and body / html open close
             */
            injectTags: function () {

                var openTags = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>Hierarchy</title></head><body>';
                var closeTags = '</body></html>';
                this.html = openTags + this.html + closeTags;

            }

            /**
             *
             * @param {string} name
             * @param {int} id
             * Open HTML section tag
             */
            openSectionHTML: function (name, id) {

                this.html += '<section class="priority-section" id="' + name + '" data-index="' + id + '">';

            },

            /**
             * Close HTML section tag
             */
            closeSectionHTML: function () {

                this.html += '</section>';

            },

            /**
             * @param {string} string
             * @returns {string}
             * Slugify strings
             */
            slugify: function (string) {

                return string.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            }

        }

    }]);
