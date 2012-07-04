function HandleScriptObject(templateName, divID, jsonUrl, jsFile, css, delayLoad)  
{
	var _template = null;
	var _templateName = templateName;
	var _compiledHtml = null;
	var _divID = divID;
	var _dataUrl = jsonUrl;
	var _css = css;
	var _jsFile = jsFile;
	var _delayLoad = delayLoad;
	
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
		this.getTemplate();
		var source = Handlebars.compile(_template);
		
		if(_dataUrl != null && _dataUrl != "")
		{
			//TODO should we do error checking on the urlParams? like validate the question mark, etc
			$.getJSON(_dataUrl+"?"+urlParams, function(JsonData)
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
				//var result = $(data).find( "//page[name='"+ name+"']");
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
					$(item).attr("delayLoad"));
					
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
				//wait before execution of next call
				if(_element != null && _element != "")
				{
					element.append($('<div/>').attr('id', HandleScriptObject.generateID()).html(_children[templateName].getHtml()));
					callback();
				}
				else
				{
					var elementToBind = '#'+_children[templateName].getDivIDForBinding()+'';
					$(elementToBind).html(_children[templateName].getHtml());
					if(callback != null)
					{
						callback();
					}
				}
			});
		}
	}
	
	this.render = function()
	{
		//sum up children templates
		for (var key in _children) 
		{
			if (_children.hasOwnProperty(key))
			{
				if(_children[key].getDelayLoad() == "false")
				{
					_children[key].compileTemplate();
					if (_element != null && _element != "")
					{
						//in this case you have an id in the main page (like the body) and you can append
						//a dynamic div with html.  This is in the case you do not want to declare the divs in
						//the html page and instead wrap the template fragments with dynamic divs
						
						element.append($('<div/>').attr('id', HandleScriptObject.generateID()).html(_children[key].getHtml()));
					}
					else
					{
						//this is when you declare your divs on the html page and add them to pages.xml
						var elementToBind = '#'+_children[key].getDivIDForBinding()+'';
						$(elementToBind).html(_children[key].getHtml());
					}
				}
			}
		}
	}
}