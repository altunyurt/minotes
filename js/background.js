chrome.browserAction.onClicked.addListener(
    function(tab){
        chrome.tabs.sendRequest(tab.id, 
                                {command: "newEmptyNote"}, 
                                function(response) {});
    }
);


/*
 * localStorage placement: 
 * key: url 
 * value: [note1, note2 ...]
 *
 */

function updateBadge(notes, sender){
    return chrome.browserAction.setBadgeText({text: notes.length.toString(), tabId: sender.tab.id});
};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    var url = sender.tab.url.replace(/^https?:\/\//,"").replace(/#.*$/,""),
        notes = localStorage[url] ? JSON.parse(localStorage[url]) : [],
        response = {status: "success"};

    if (request.command == 'getNotes'){
        updateBadge(notes, sender);
        return sendResponse({'notes': notes});
    } else if (request.command == 'createNote'){
        var data = {
            content: "",
            position: request.position,
            epoch: request.epoch
        };
        notes.push(data);
    } else if (request.command == 'updateNoteContent'){
        for(var i=0; i<notes.length; i++){
            var note = notes[i];
            if (note.epoch == request.epoch){
                note.content = request.content;
                notes[i] = note;
            }
        }
    } else if (request.command == 'updateNotePosition'){
        for(var i=0; i<notes.length; i++){
            var note = notes[i];
            if (note.epoch == request.epoch){
                note.position = request.position;
                notes[i] = note;
            }
        }
    } else if (request.command == 'deleteNote'){
        for(var i=0; i<notes.length; i++){
            var note = notes[i];
            if (note.epoch == request.epoch){
                notes.splice(i, 1);
                break;
            }
        }
    }
    updateBadge(notes, sender);
    localStorage[url] = JSON.stringify(notes); 
    sendResponse(response);
});

