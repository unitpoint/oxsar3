BaseController = extends Controller {
	pageTitle = "Oxsar 3 Title",
	
	pageAuthor = "Evgeniy Golovin",
	
	pageDesc = <<<END'
Oxsar 3 is a strategy-game set in space
END,
	
	pageKeywords = "Oxsar strategy-game",
	
	init = function(){
		super()
		header("Expires: "..(DateTime.now()-1).format("R"))
		header("Last-Modified: "..(DateTime.now()-2).format("R"))
		
		app.isLocal = app.request.hostInfo == "http://oxsar3"
	},
}