chrome.contextMenus.create(
    {
        'title': 'Add note here', 
        //"contexts": ['selection'], 
        "onclick": openNoteEditor
    }
);


/*
 * localStorage placement: 
 * key: url 
 * value: [note1, note2 ...]
 *
 */



function openNoteEditor(){
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendRequest(tab.id, 
                                {command: "openNoteEditor"}, 
                                function(response) {});
    });
};


chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    var url = sender.tab.url;
    if (request.command == 'getNotes'){
        var notes = localStorage[url] || "[]";
        console.log(notes);
        sendResponse({'notes': JSON.parse(notes)});

    } else if (request.command == 'createNote'){
        var record = localStorage[url] ? JSON.parse(localStorage[url]) : [];
        var data = {
            content: request.content,
            position: request.position,
            relativeposition: request.relativeposition,
            epoch: (new Date()).valueOf()
        };
        record.push(data);
        localStorage[url] = JSON.stringify(record); 
        sendResponse({data: record});
    }
});

