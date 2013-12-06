bubble_show_text = function(x,y,text){

    $('<p>'+text+'</p>')
        .attr({ style: "z-index:10;position:absolute; left:"+ x + ";top:" + y + "; min-width: 200px; width: "+text.length*8})
        .addClass("speech")
        .click(function(){$(this).fadeOut()})
        .delay(5000).fadeOut()
        .appendTo($('body')
        )
    ;
}