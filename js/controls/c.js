function sayC()
{
	content.renderTemplate("b.handlebars", "", function(templateName, divID)
	{
		alert("loaded template:"+templateName+" as divID: "+divID);
	});
	return false;
}