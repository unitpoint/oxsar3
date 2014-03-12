GameAjaxController = extends BaseController {

	init = function(){
		super()
		header "Content-Type: application/json"
		// app.user.isLogged || @echoJson{error="required user.isLogged"}
		app.request.isAjax || @echoJson{error="required request.isAjax"}
	},
	
	echoJson = function(data, end){
		echo(json.encode(data))
		end !== false && app.end()
	},
	
	actionLoadTileData = function(x, y, g, zoom){
		x, y, g, zoom = toNumber(x), toNumber(y), toNumber(g), toNumber(zoom)
		var tileData = []
		for(var ax = 0; ax < app.params.TILE_SIZE; ax++){
			tileData[ax] = []
		}
		math.randomSeed = 1234567890+x*123+y*234+g*345;
		var i = math.max(math.abs(x) - (x<0?1:0), math.abs(y) - (y<0?1:0))
		for(var ax = 0; ax < app.params.TILE_SIZE; ax++){
			for(var ay = 0; ay < app.params.TILE_SIZE; ay++){
				if(math.random() <= math.max(0.04, 0.3-i/20)){
					tileData[ax][ay] = {
						i = i,
						// x = 5, y = 5,
						size = math.random(0.3+i/10, math.min(1+ax, 1+ay, app.params.TILE_SIZE-ax, app.params.TILE_SIZE-ay, 1+i/5)),
						type = math.random(math.min(8, 2+i)),
					}
				}
			}
		}
		
		@echoJson {data = tileData, params = {x=x, y=y, g=g, zoom=zoom}}
	},
}