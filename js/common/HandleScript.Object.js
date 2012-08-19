function HandleScriptObject(templateName, divID, jsonUrl, jsFile, css, delayLoad, single)  
{
    var _template = null;
    var _templateName = templateName;
    var _compiledHtml = null;
    var _divID = divID;
    var _dataUrl = jsonUrl;
    var _css = css;
    var _jsFile = jsFile;
    var _delayLoad = delayLoad;
    var _single = single;
    var _loaded = false;
    
    this.getIsLoaded = function()
    {
        return _loaded;
    }

    this.setIsLoaded = function()
    {
        _loaded = true;
    }

    this.getSingle = function()
    {
        if(_single != null && _single != "")
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    
    this.getDivIDForBinding = function(shouldGenerate)
    {
        if(shouldGenerate == true)
        {
            _divID = HandleScriptObject.generateID();
        }
        return _divID;
    }
    
    //this will be used in the case that you do not want the template expanded upon page load
    //but will expand it with an event
    this.getDelayLoad = function()
    {
        return _delayLoad;
    }
    
    this.getTemplate = function()
    {
        if(null == _templateName)
        {
            return;
        }
        
        var templateURL = window.location.protocol + "//" + window.location.host + "/handlebars_templates/controls/" + _templateName;
        
        var jsUrl = window.location.protocol + "//" + window.location.host + "/js/controls/" + _jsFile;
        
        var cssUrl = window.location.protocol + "//" + window.location.host + "/css/controls/" + _css;
        
        $.ajax({
            url:templateURL,
            success:function(data)
            {
                //replace the template with the data from the request
                _template = data;
                
                if(_jsFile != null && _jsFile != "")
                {
                    var newScriptElement = document.createElement('script');
                    newScriptElement.setAttribute('type','text/javascript');
                    newScriptElement.setAttribute('src', jsUrl);
                    document.getElementsByTagName("head")[0].appendChild(newScriptElement);
                }
                if(_css != null && _css != "")
                {
                    var newStyleElement = document.createElement('link');
                    newStyleElement.setAttribute('rel','stylesheet');
                    newStyleElement.setAttribute('type','text/css');
                    newStyleElement.setAttribute('href', cssUrl);
                    document.getElementsByTagName("head")[0].appendChild(newStyleElement);
                }
            },
            async:false
        });
    }
    
    this.setTemplate = function(templateName)
    {
        _templateName = templateName;
    }
    
    this.compileTemplate = function(urlParams, callback)
    {
        if(this.getIsLoaded() == false)
        { 
            this.getTemplate();
            var source = Handlebars.compile(_template);
            
            if(_dataUrl != null && _dataUrl != "")
            {
                //TODO should we do error checking on the urlParams? like validate the question mark, etc
                $.getJSON(urlParams == null ? _dataUrl : _dataUrl+"?"+urlParams, function(JsonData)
                {
                    _compiledHtml = source(JsonData);
                    callback();
                });
            }
            else
            {
                _compiledHtml = source("");

                if(callback != null)
                {
                    callback();
                }
            }
        }
        else
        {
            //the data is already loaded, lets call back the function to let them know the data is there already
            callback();
        }
    }
    this.getHtml = function()
    {
        return _compiledHtml;
    }
}

//static function
//this returns a generated div with 8 characters + a number between 1-10000
//example YTDKHRIL498
HandleScriptObject.generateID = function()
{
    var maxRandom = 10000;
    var textMaxRandom = 8;    
    var min = 65; //A
    var max = 90; //Z
    var textRandom = "";
    for(var i = 0; i < textMaxRandom; i++)
    {
        //chars are between 65 and 90
        var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        textRandom += String.fromCharCode(randomNum);
    }
    var numericRandom = Math.floor(Math.random()*maxRandom+1);
    return textRandom + numericRandom;
}    

function HandleScriptContent(element) {
    var _element = element;
    var _children = new Object();
        
    this.add = function(name, item)
    {
        if(! _children.hasOwnProperty(name))
        {
            _children[name] = item;
        }
    }
    
    this.load = function()
    {
        var _this = this;
        $.ajax({
        url: '/common/layout/pages.xml',
        success: function(data)
        {
            var pathParts = window.location.pathname.split('/');
            var name = pathParts[pathParts.length - 1].toLowerCase();
            var pages = data.getElementsByTagName("page");
            var result = null;
            
            //we need to do a case insensitive compare of page name 
            //because browsers do not care about sensitivity but XML does
            for(var count = 0; count < pages.length; count++)
            {
                var page = $(pages[count]);
                var pageName = page.attr("name").toLowerCase();
                if(name == pageName)
                {
                    result = page;
                    break;
                }
            }
            
            if(result != null)
            {
                var templates = $(result).find("Template");
                $.each(templates, function(i, item)
                {
                    var name = $(item).attr("name");
                    var handleObj = new HandleScriptObject(
                    name,
                    $(item).attr("bindingDiv"),
                    $(item).attr("jsonUrl"),
                    $(item).attr("js"),
                    $(item).attr("css"),
                    $(item).attr("delayLoad"),
                    $(item).attr("single"));
                    
                    _this.add(name, handleObj);
                });
            }
        }, 
        async: false });
    }
    
    
    this.renderTemplate = function(templateName, jsonUrlParams, callback)
    {
        if(_children.hasOwnProperty(templateName))
        {
            _children[templateName].compileTemplate(jsonUrlParams, function()
            {
                var addElement = false;
                //wait before execution of next call
                if(_element != null && _element != "")
                {
                    var elementName = null;

                    if(_children[templateName].getSingle() == true)
                    {
                        if(_children[templateName].getIsLoaded() == false)
                        {
                            elementName = templateName;
                            addElement = true;
                        }
                    }
                    else
                    {
                        //in this case you have an id in the main page (like the body) and you can append
                        //a dynamic div with html.  This is in the case you do not want to declare the divs in
                        //the html page and instead wrap the template fragments with dynamic divs
                        
                        elementName = HandleScriptObject.generateID();
                        addElement = true;
                    }
                    
                    if(_children[templateName].getIsLoaded() == false)
                    {
                        //set this so we do not request the items again if the template is reused
                        _children[templateName].setIsLoaded();
                    }
                    
                    if(addElement == true)
                    {
                        element.append($('<div/>').attr('id', elementName).html(_children[templateName].getHtml()));
                        if(callback != null)
                        {
                            callback(templateName, elementName);
                        }
                    }
                }
                else
                {
                    var elementToBind = '#'+_children[templateName].getDivIDForBinding()+'';
                    $(elementToBind).html(_children[templateName].getHtml());
                    if(callback != null)
                    {
                        callback(templateName, _children[templateName].getDivIDForBinding());
                    }
                }
            });
        }
    }
    
    this.render = function(callback)
    {
        for (var key in _children) 
        {
            if (_children.hasOwnProperty(key))
            {
                if(_children[key].getDelayLoad() == "false")
                {
                    this.renderTemplate(key, null, callback);
                }
            }
        }
    }
}