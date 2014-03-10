MapWidget = extends Widget {
	containerId = null,
	run = function(){
		echo @renderPartial("{widgets}/views/MapWidget", {
			containerId = @containerId,
		})
	},
}