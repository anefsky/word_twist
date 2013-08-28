var Utils = {
	getIntPartOnly : function(string) {
		return parseInt(string.replace(/\D/g, ''));
	},
	zfill : function(num, len) { //pads leading zeroes
		return (Array(len).join("0") + num).slice(-len);
	}
}

var JsonRetrieval = function() {
	var _jsonObj = null;
	var _url = null;

	this.setUrl = function(url) {
		_url = url;
	}
	this.load = function() {
		self = this;
		$.ajax({
			type : "GET",
			url : _url,
			async : false,
			dataType : "json",
			success : function(data) {
				_jsonObj = data;
			},
			error : function(xhr, ajaxOptions, thrownError) {
				alert(xhr.status);
				alert(thrownError);
			}
		});
	}
	this.getJsonObj = function() {
		return _jsonObj;
	}
}

var GameApp = (function() { // Singleton
	var instance; // stores reference to Singleton

	function init() { // runs on creation
		// Private methods and variables
		var _cfgParams = {
			"GAME_TIME_SECS" : 60,
			"TILE_WIDTH" : 120,
			"TILE_HEIGHT" : 120,
			"MOUNTING_POST_DIAMETER" : 50,
			"PAD_WIDTH" : 140,
			"PAD_HEIGHT" : 140,
			"PAD_BORDER_WIDTH" : 5,
			"PAD_SPACING" : 0
		};
		var _mapIdToObj = {}
		return {
			// Public methods and variables
			getCfgParam : function(key) {
				return _cfgParams[key];
			},
			appendMapIdToObj : function(selectorId, obj) {
				_mapIdToObj[selectorId] = obj;
			},
			getObjFromId : function(selectorId) {
				return _mapIdToObj[selectorId];
			}
		};
	}
	return {
		getInstance : function() {
			if (!instance) {
				instance = init();
			}
			return instance;
		}
	};
})();

var Tile = function() {
	var _selectorId = null;
	var _displayValue = null;

	this.setDisplayValue = function(value) {
		_displayValue = value;
	}
	this.getDisplayValue = function() {
		return _displayValue;
	}
	this.setSelectorId = function(value) {
		_selectorId = value;
	}
	this.render = function(parentSelectorId, locationX, locationY) {
		// create new DOM element
		var parentSelector = "#" + parentSelectorId;
		var el = $("<div/>").appendTo(parentSelector);
		$(el).attr("id", _selectorId)
		$(el).addClass('tile');
		$(el).css({
			"width" : this.width,
			"height" : this.height,
			"line-height" : this.height + "px",
			'border-radius' : Math.floor(this.height / 2),
			"left" : locationX,
			"top" : locationY
		});
		$(el).text(_displayValue);
	}
	this.move = function(deltaX, deltaY) {
		$('#' + _selectorId).animate({
			top : '+=' + deltaY,
			left : '+=' + deltaX
		}, 'medium');
	}
	this.moveBetweenPalates = function(fromPalate, fromSlot, toPalate, toSlot) {
		var fromPalateSlctr = '#' + fromPalate.getSelectorId();
		var toPalateSlctr = '#' + toPalate.getSelectorId();
		var deltaX = toPalate.getSlotPosition(toSlot).x - 
			fromPalate.getSlotPosition(fromSlot).x;
		var deltaY = Utils.getIntPartOnly($(toPalateSlctr).css('top'))
			- Utils.getIntPartOnly($(fromPalateSlctr).css('top'));
		this.move(deltaX, deltaY);	
		toPalate.addTile(this, toSlot);
		fromPalate.removeTile(this);
	}
}

var TilePalate = function(palateSize) {
	var _selectorId = null;
	var _arrTiles = [];
	for(var i = 0; i < palateSize; i++) { // init tile array
		_arrTiles.push(null);
	}

	this.setSelectorId = function(value) {
		_selectorId = value;
	}
	this.getSelectorId = function() {
		return _selectorId;
	}
	this.render = function(parentSelectorId) {
		// create new DOM element
		var parentSelector = "#" + parentSelectorId;
		var el = $("<div/>").appendTo(parentSelector);
		$(el).attr("id", _selectorId)
	}
	this.getPosition = function() { //relative to container
		var selector = "#" + _selectorId;
		var x = Utils.getIntPartOnly($(selector).css('left'));
		var y = Utils.getIntPartOnly($(selector).css('top'));
		return {
			"x" : x,
			"y" : y
		}
	}
	this.getSlotPosition = function(slotIndex) {  // relative to palate start
		var startPosition = this.getPosition();
		var x = slotIndex * this.getSlotWidth();
		var y = 0;
		return {
			"x" : x,
			"y" : y
		}
	}
	this.getFirstEmptySlotIdx = function() {
		for(var i = 0; i< _arrTiles.length; i++) {
			if(_arrTiles[i] === null) return i;
		}
		return -1; // no empty slots
	}
	this.getTile = function(slotIdx) {
		return _arrTiles[slotIdx];
	}
	this.addTile = function(tile, slotIdx) {
		_arrTiles[slotIdx] = tile;
	}
	this.removeTile = function(tile) {
		var slotPosition = this.getSlotPositionHoldingTile(tile);
		_arrTiles[slotPosition] = null;
	}
	this.clearTiles = function() {
		_arrTiles = [];
	}
	this.addPods = function() { // pods are tile placeholders
		var parentSelector = "#" + _selectorId;
		var gameApp = GameApp.getInstance();
		for ( var i = 0; i < _arrTiles.length; i++) {

			var slotPosition = this.getSlotPosition(i);
			var el = $("<div/>").appendTo(parentSelector);
			$(el).addClass("tile_pod");
			$(el).css({
				"width" : gameApp.getCfgParam('PAD_WIDTH'),
				"height" : gameApp.getCfgParam('PAD_HEIGHT'),
				'border-width' : gameApp.getCfgParam('PAD_BORDER_WIDTH'),
				"left" : slotPosition.x,
				"top" : slotPosition.y
			});
		}
	}
	this.getSlotPositionHoldingTile = function(tile) {
		return _.indexOf(_arrTiles, tile);
	}
	this.getSpelledWord = function() {
		var spelledWord = "";
		$.each(_arrTiles, function(index, obj) {
			if(obj !== null) // ignores unassigned slots
				spelledWord += obj.getDisplayValue();
		})
		return spelledWord;
	}
	this.getSlotWidth = function() {
		var gameApp = GameApp.getInstance();
		var width = gameApp.getCfgParam('PAD_WIDTH') + 2
				* gameApp.getCfgParam("PAD_BORDER_WIDTH")
				+ gameApp.getCfgParam("PAD_SPACING");
		return parseInt(width);
	}
	this.jumbleTiles = function() {
		var numberOfSlots = _arrTiles.length;
		var arrTilesAfterJumble = [];
		var arrNewOrder = _.shuffle(_.range(numberOfSlots)); //shuffles 0-5
		var slotWidth = this.getSlotWidth();
		
		$.each(arrNewOrder, function(index, value) {
			var tileToMove = _arrTiles[value];
			var currentSlot = value;
			var destSlot = index;
			if(tileToMove !== null) {
				var numSlotsToMoveRight = destSlot - currentSlot;
				tileToMove.move(numSlotsToMoveRight * slotWidth, 0);
				arrTilesAfterJumble.push(tileToMove);
			}
			else {
				arrTilesAfterJumble.push(null);
			}
		})
		_arrTiles = arrTilesAfterJumble;	
	}
	this.addMountingPosts = function() {
		var gameApp = GameApp.getInstance();
		for(var slotIdx = 0; slotIdx < _arrTiles.length; slotIdx++) {
			var postDiameter = gameApp.getCfgParam('MOUNTING_POST_DIAMETER');
			var padWidth = gameApp.getCfgParam('PAD_WIDTH');
			var padBorderWidth = gameApp.getCfgParam('PAD_BORDER_WIDTH');
			var postOffsetX = padBorderWidth + 0.5 * (padWidth - postDiameter);
			var postOffsetY = postOffsetX;
			var postPositionX = this.getSlotPosition(slotIdx).x + postOffsetX;
			var postPositionY = this.getSlotPosition(slotIdx).y + postOffsetY;
			var parentSelector = "#" + 'source_palate';
			var el = $("<div/>").appendTo(parentSelector);
			$(el).addClass('mounting_post');
			$(el).css({
				"width" : postDiameter,
				"height" : postDiameter,
				'border-radius' : Math.floor(postDiameter/ 2),
				"left" : postPositionX,
				"top" : postPositionY,
			});
		}
	}
	this.getPopulatedSlots = function() {
		var arrPopulatedSlots = [];
		$.each(_arrTiles, function(index, val) {
			if(val !== null) arrPopulatedSlots.push(index);
		})
		return arrPopulatedSlots;
	}
	this.getEmptySlots = function() {
		var arrEmptySlots = [];
		$.each(_arrTiles, function(index, val) {
			if(val === null) arrEmptySlots.push(index);
		})
		return arrEmptySlots;
	}
	this.hasTile = function(tile) {
		return _.indexOf(_arrTiles, tile) !== -1;
	}
}

var StopwatchWidget = function(gameplayObj) {
	var _gameplayObj = gameplayObj;
	var _startTimeSeconds = null;
	this.setTotalTime = function(val) {
		_startTimeSeconds = val;
	}
	this.start = function() {
		this.updateDisplay(_startTimeSeconds);
		self = this;
		var secondsRemaining = _startTimeSeconds;
		var t = setInterval(function() {
			self.updateDisplay(--secondsRemaining);
			if (secondsRemaining === -1) {
				clearInterval(t);
				self.endGame();
			}
		}, 1000);
	}
	this.endGame = function() {
		var selector = '#' + this.getTextSelectorId();
		$(selector).text("Game over!");
		$(selector).css('color', 'red');
		//disable buttons
		$("button").attr('disabled', 'disabled');
		_gameplayObj.endGame();
	}
	this.getTextSelectorId = function() {
		return 'stopwatch';
	}
	this.updateDisplay = function(secondsRemaining) {
		var minsAndSecs = this.convtTimeSecsToMins(secondsRemaining);
		var text = "Time: " + Utils.zfill(minsAndSecs.minutes, 2) + 
			":" + Utils.zfill(minsAndSecs.seconds, 2);
		$('#' + this.getTextSelectorId()).text(text);
	}
	this.convtTimeSecsToMins = function(seconds) {
		var numMinutes = Math.floor(seconds / 60);
		var numSeconds = seconds % 60;
		return {
			"minutes" : numMinutes,
			"seconds" : numSeconds
		};
	}
}

var WordMatchesArea = function() {
	var _words = [];
	var _selectorId = "word_matches_area";
	var _mapWordIdxToId = {};
	
	this.addWord = function(word) {
		_words.push(word);
	}
	this.render = function() {
		// sort by alphabet, size
		_words.sort();
		_words.sort(function(a,b){return a.length - b.length});
		
		var numWords = _words.length;
		var numColumns = 3;
		var maxWordsPerColumn = Math.ceil(numWords / numColumns);
		self = this;
		var elColumn = null;
		var selectorId = null;
		$.each(_words, function(index, word) {
			if(index % maxWordsPerColumn == 0 ) { // new column
				elColumn = $("<div/>").appendTo('#' + _selectorId);
				elColumn.addClass('words_column');
			}
			selectorId = "word_" + index;
			_mapWordIdxToId[index] = selectorId;
			self.renderWord(word, selectorId, elColumn);
		})
	}
	this.renderWord = function(word, selectorId, elColumn) {
		var elWord = $("<div/>").appendTo(elColumn);
		elWord.attr('id', selectorId);
		elWord.addClass('allowed_word');
		elWord.addClass('text_transparent');
		var arrLetters = word.toUpperCase().split('');
		$.each(arrLetters, function(index, value) {
			var elLetter = $("<div/>").appendTo(elWord);
			elLetter.addClass('allowed_word_letter');
			elLetter.text(value);
		})	
	}
	this.getWordMatchedIdx = function(word) {
		for(var i = 0; i < _words.length; i++) {
			if(_words[i].toLowerCase() == word.toLowerCase())
				return i;
		}
		return -1; // not found
	}
	this.showWord = function(wordIndex) {
		var selectorId = _mapWordIdxToId[wordIndex];
		$('#' + selectorId).removeClass('text_transparent')
			.addClass('matched_word');
		
	}
	this.showAllWords = function() {
		for(var index in _mapWordIdxToId) { // key == index
			var selectorId = _mapWordIdxToId[index];
			$('#' + selectorId).removeClass('text_transparent')
		}
	}
}

var ScoreWidget = function() {
	var _scoreValue;
	var _selectorId = "score";
	
	this.init = function() {
		_scoreValue = 0;
		
	}
	this.render = function() {
		$('#' + _selectorId).text("Score: " + _scoreValue);
	}
	this.addToScore = function(value) {
		_scoreValue += value;
		this.render();
	}
}

var GamePlay = function() {
	var _playLetters;
	var _arrAllowedWords;
	var _wordMatchesArea;
	var _scoreWidget;
	var _stopwatch;
	var _gameApp = GameApp.getInstance();

	this.init = function() {
		var _sourcePalate = null;
		var _destPalate = null;
		this.addPalates();
		this.addTiles();
		this.addWordMatchesArea();
		
		_stopwatch = new StopwatchWidget(this);
		_stopwatch.setTotalTime(_gameApp.getCfgParam('GAME_TIME_SECS'));

		_scoreWidget = new ScoreWidget();
		_scoreWidget.init();
		_scoreWidget.render();
	}
	this.getWordMatchesArea = function() {
		return _wordMatchesArea;
	}
	this.getStopWatch = function() {
		return _stopwatch;
	}
	this.getScoreWidget = function() {
		return _scoreWidget;
	}
	this.setAllowedWords = function(arr) { 
		_arrAllowedWords = arr;
	}
	this.addPalates = function() {
		var palateSize = _playLetters.length;
		_destPalate = new TilePalate(palateSize);
		var destSelectorId = 'dest_palate';
		_destPalate.setSelectorId(destSelectorId);
		_gameApp.appendMapIdToObj(destSelectorId, _destPalate);
		_destPalate.render('palates_area');
		_destPalate.addPods();		
		_sourcePalate = new TilePalate(palateSize);
		var srcSelectorId = "source_palate";
		_sourcePalate.setSelectorId(srcSelectorId);
		_gameApp.appendMapIdToObj(srcSelectorId, _sourcePalate);
		_sourcePalate.render('palates_area');
		_sourcePalate.addMountingPosts();
	}
	this.addTiles = function() {
		var gameApp = GameApp.getInstance();
		var arrPlayLetters = _playLetters.split('');
		arrPlayLetters = _.shuffle(arrPlayLetters);
		$.each(arrPlayLetters, function(index, value) {
			var tile = new Tile();
			tile.setDisplayValue(value);
			var selectorId = "tile_" + index;
			tile.setSelectorId(selectorId);
			tile.width = gameApp.getCfgParam('TILE_WIDTH');
			tile.height = gameApp.getCfgParam('TILE_HEIGHT');

			var nextSlotIdx = _sourcePalate.getFirstEmptySlotIdx();
			var nextSlotPosition = _sourcePalate.getSlotPosition(nextSlotIdx);
			var padBorderWidth = gameApp.getCfgParam('PAD_BORDER_WIDTH');
			var padWidth = gameApp.getCfgParam('PAD_WIDTH');
			var tileOffsetX = padBorderWidth + 0.5 * (padWidth - tile.width);
			var tileOffsetY = tileOffsetX; // same because of symmetry
			tile.render('source_palate', nextSlotPosition.x + tileOffsetX,
					nextSlotPosition.y + tileOffsetY);
			gameApp.appendMapIdToObj(selectorId, tile);
			_sourcePalate.addTile(tile, nextSlotIdx);
		})
		$('.tile').addClass('text_transparent');
	}
	this.setPlayLetters = function(string) {
		_playLetters = string;
	}
	
	this.addWordMatchesArea = function() {
		_wordMatchesArea = new WordMatchesArea();
		$.each(_arrAllowedWords, function(index, value){
			_wordMatchesArea.addWord(value);
		})
		_wordMatchesArea.render();
	}
	this.getGameRoundData = function() {
		// get list of dictionaries
		var jsonDictionary = "json/dictionaries.json";
		var jsonRetrieval = new JsonRetrieval();
		jsonRetrieval.setUrl(jsonDictionary);
		jsonRetrieval.load();
		var jsonObj = jsonRetrieval.getJsonObj();
		var arrDictionaries = jsonObj.dictionaries;
		console.log("arrDictionaries = " + arrDictionaries);
		// choose one
		var index = Math.floor(arrDictionaries.length * Math.random());
		console.log("index = " + index);
		var dictionaryFile = arrDictionaries[index];
		
		// get dictionary entries
		var jsonFile = "json/" + dictionaryFile;
		
		console.log ("jsonFile = " + jsonFile);
		var jsonRetrieval = new JsonRetrieval();
		jsonRetrieval.setUrl(jsonFile);
		jsonRetrieval.load();
		var jsonObj = jsonRetrieval.getJsonObj();
		return jsonObj;
	}
	this.endGame = function() {
		_wordMatchesArea.showAllWords();
	}
	
}

$(function() {
	$('button').removeAttr('disabled');
	var _gameApp = GameApp.getInstance();
	var _gamePlay = new GamePlay();
	var gameDataJson = _gamePlay.getGameRoundData();
	var playLetters = gameDataJson.fullWord.toUpperCase();
	_gamePlay.setPlayLetters(playLetters);
	var arrAllowedWords = gameDataJson.words;
	_gamePlay.setAllowedWords(arrAllowedWords);
	_gamePlay.init();
	var _source_palate = _gameApp.getObjFromId('source_palate');
	var _dest_palate = _gameApp.getObjFromId('dest_palate');
	var _wordMatchesArea = _gamePlay.getWordMatchesArea();
	
	$('button#start_game').click(function() {
		$(this).hide();
		$('.tile').removeClass('text_transparent');
		_gamePlay.getStopWatch().start();
	})
	
	$(".tile").click(function() {
				var selectorId = $(this).attr('id');
				var tile = _gameApp.getObjFromId(selectorId);
				if(_source_palate.hasTile(tile)) { // only move if on source 
					var srcTileSlotIdx = _source_palate
							.getSlotPositionHoldingTile(tile);
					var destTileSlotIdx = _dest_palate.getFirstEmptySlotIdx();
					tile.moveBetweenPalates(_source_palate, srcTileSlotIdx,
							_dest_palate, destTileSlotIdx);
				}
	})

	$("button#twist_text").click(function() {
		_source_palate.jumbleTiles();
	})
	$('button#enter_word').click(function() {
		var word = _dest_palate.getSpelledWord();
		var wordMatchesArea = _gamePlay.getWordMatchesArea();
		var wordIndex = wordMatchesArea.getWordMatchedIdx(word);
		if(wordIndex !== -1) {
			wordMatchesArea.showWord(wordIndex); 
			_gamePlay.getScoreWidget().addToScore(word.length);
		}
//		wordMatchesArea.showAllWords(); 
		$('button#clear_tiles').click(); // reset palates

	})
	$('button#clear_tiles').click(function() {
		// for each dest tile, move to first available src palate slot
		var arrDestPopulatedSlots = _dest_palate.getPopulatedSlots();
		var arrSrcEmptySlots = _source_palate.getEmptySlots();
		for(var i = 0; i < arrDestPopulatedSlots.length; i++) {
			var fromSlotIdx = arrDestPopulatedSlots[i];
			var toSlotIdx = arrSrcEmptySlots[i];
			var tile = _dest_palate.getTile(fromSlotIdx);
			tile.moveBetweenPalates(_dest_palate, fromSlotIdx,
					_source_palate, toSlotIdx);
		}
	})
});
