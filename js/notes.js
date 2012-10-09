jQuery.fn.exists = function(){ 
    return this.length > 0; 
};

/* {{{ Jquery XPath Plugin
 * XPath - jQuery wrapper for the DOM 3 XPath API exposed by document.evaluate()
 *
 * Copyright © 2010 John Firebaugh
 *
 * Dual licensed under the MIT or GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

(function ($) {
	var xp = function (xpath, contextNode) {
		var iterator = document.evaluate(xpath, contextNode, null, XPathResult.ANY_TYPE, null),
		    node     = iterator.iterateNext(),
		    nodes    = [];

		while (node) {
			nodes.push(node);
			node = iterator.iterateNext();
		}

		return nodes;
	};

	$.xpath = function (xpath) {
		return $(xp(xpath, document));
	}

	$.fn.xpath = function (xpath) {
		var nodes = [];

		this.each(function () {
			nodes.push.apply(nodes, xp(xpath, this));
		});

		return this.pushStack(nodes, "xpath", xpath);
	}
})(jQuery);
// }}}

var NotesMaster = new function() {
    var self = this;
    self.notes = [];
    self.identifier = (new Date()).valueOf();
    self.targetPosition = null;
    self.targetXpath = null;
    self.targetRelativePosition = null;
    self.layout = $("<div id='noteEditorLayout_" + self.identifier + "'></div>");
    self.layout.click(function(){return self.closeEditor()});

    self.noteEditor = $(
        "<div id='noteEditor_" + self.identifier + "' style='background-color: transparent;'>"
        + "<textarea style='width: 100%; height: 100%; padding: 4px; border-radius: 4px;'></textarea>"
        + "<div style='float: right; background-color: white;'><button>Save</button></div>"
        + "</div>"
        );
    self.noteEditor.find("button").click(function(){ return self.saveNote()})

    self.setVars = function(event){
        self.targetPosition = [event.clientX, event.clientY];
        self.targetXpath = self.getElementXPath(event.toElement);
        self.targetRelativePosition = [event.offsetX, event.offsetY];
    };

    self.updateNotes = function(notes){
        $(".note_" + self.identifier).remove();
        self.notes = notes;
        $(self.notes).each(function(idx, note){
            var relItem = $.xpath(note.relativeposition.xpath);
            var relPos = note.relativeposition.position;
            
            if (!relItem){
                return;
            }
            
            var rpos = relItem.position();
            $("body").append(
                $("<div class='note_" + self.identifier +"' id='note_"+ note.epoch +"'>"
                    + "<img  style='box-shadow: 0 0 10px gray;' src='"+ chrome.extension.getURL("note.png") + "'>"
                    + "<span style='display: none;'>"+ note.content +"</span>"
                +"</div>").css({
                    position: "absolute",
                    display: "inline-block",
                    maxWidth: "200px",
                    height: "auto",
                    overflow: "hidden",
                    top: rpos.top + relPos[1],
                    left: rpos.left + relPos[0]
                }).hover(function(){
                    $(this).find("span").show().css({backgroundColor: "rgba(255,224,0, 0.8)"});
                }, function(){
                    $(this).find("span").hide();
                })
            );
        });
    };


    // from firebug 
    self.getElementTreeXPath = function(element)
    {
        var paths = [];

        // Use nodeName (instead of localName) so namespace prefix is included (if any).
        for (; element && element.nodeType == 1; element = element.parentNode)
        {
            var index = 0;
            for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
            {
                // Ignore document type declaration.
                if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                    continue;

                if (sibling.nodeName == element.nodeName)
                    ++index;
            }

            var tagName = element.nodeName.toLowerCase();
            var pathIndex = (index ? "[" + (index+1) + "]" : "");
            paths.splice(0, 0, tagName + pathIndex);
        }

        return paths.length ? "/" + paths.join("/") : null;
    };

    self.getElementXPath = function(element)
    {
        if (element && element.id)
            return '//*[@id="' + element.id + '"]';
        else
            return self.getElementTreeXPath(element);
    };


    self.openNoteEditor = function(content){
        $("body").append(
                    self.layout.css({
                        height: "100%",
                        width: "100%",
                        position: "fixed",
                        top: 0,
                        left: 0,
                        backgroundColor: "rgba(44,44,44,0.2)"
                        })
        ).append(
            self.noteEditor.css(
            {
                position: "fixed",
                top: "100px",
                left: "100px",
                height: "200px",
                width: "400px"

            })
        );
    };

    self.saveNote = function(){
        // aktif not içeriği
        chrome.extension.sendRequest(
            {
                command: "createNote",
                content: $("#noteEditor_" + self.identifier + " textarea").val(),
                position: self.targetPosition,
                relativeposition: {xpath: self.targetXpath, 
                                    position: self.targetRelativePosition}
            },
            function(response){
                console.log("response to saveNotes", response);
            }
        );
        
    };

    self.closeEditor = function(){
        $("body").find(
            "#noteEditor_" + self.identifier +", #noteEditorLayout_" + self.identifier).remove();
    };

}();




$(document).mousedown(function(event){
    if (event.button == 2){
        NotesMaster.setVars(event);
    } 
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.command == 'openNoteEditor'){
        return NotesMaster.openNoteEditor("");
    }
});

chrome.extension.sendRequest(
    {command: "getNotes"},
    function(response){
        NotesMaster.updateNotes(response.notes);
    }
);
