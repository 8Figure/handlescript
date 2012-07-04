function sayC()
{
	content.renderTemplate("b.handlebars", "", function()
	{
		alert('loaded');
	});
	return false;
}