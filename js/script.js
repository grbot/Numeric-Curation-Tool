
window.n_caps=[];	
url='http://localhost/api/v1/topics';
jQuery.getJSON(url+"&callback=?", function(grades) {
	window.n_caps=grades;
	for (var i in grades){
		grade = grades[i];
		grade_title = grade['grade'];
		$('select.numeric_grade_box')
			.append($("<option></option>")
			.attr("value",i)
			.text(grade_title));
	}
	//setup onChange event for Numeric Grade
	$('select.numeric_grade_box').change(function(){
		$('select.numeric_week_box').attr('disabled','disabled');
		//Fetch terms, populate the term box
		selected_id = $(this).val();//grab id of element selected
		console.log('grade id: '+selected_id);
		$('select.numeric_term_box option').not('option[value=select_title]').remove();
		$('select.numeric_week_box option').not('option[value=select_title]').remove();
		terms = n_caps[selected_id]['children'];
		for (var i in terms){
			term = terms[i];
			term_title=terms[i]['term'];
			$('select.numeric_term_box')
				.append($("<option></option>")
				.attr("value",i)
				.text(term_title));
		}//populate the Term box.
		$('select.numeric_term_box').removeAttr('disabled');
		console.log('changed grade');
	});
	//setup onChange event for Numeric Term
	$('select.numeric_term_box').change(function(){
		//Fetch weeks/topics, populate the week/topic box
		grade_id = $('select.numeric_grade_box').val();
		term_id = $('select.numeric_term_box').val();
		$('select.numeric_week_box option').not('option[value=select_title]').remove();
		weeks = n_caps[grade_id]['children'][term_id]['children'];
		for (var i in weeks){
			week = weeks[i];
			caps_id = week['caps_id'];
			week_title=weeks[i]['week'];
			topic_title=weeks[i]['topic'];
			$('select.numeric_week_box')
				.append($("<option></option>")
				.attr("value",caps_id)
				.text(week_title+': '+topic_title));
		}//populate the Term box.
		$('select.numeric_week_box').removeAttr('disabled');
		console.log('changed grade');
	});
	//setup onChange event for Numeric Week
	$('select.numeric_week_box').change(function(){
		$('div#curated_content div.ui-widget-content h3 a').text('Loading...');
		$('div#curated_content div.ui-widget-content  li').remove();
		//Fetch videos, populate the curriculum box with class="ui-widget-content"
		caps_id = $(this).val();
		console.log('setting id to '+caps_id);
		$('div#curated_content div.ui-widget-content').attr('id',caps_id);
		topic_name = $(this).find(':selected').text();
		console.log('Topic:::'+topic_name);
		if (caps_id=='select_text')
			return;
		url='http://localhost/api/v1/caps_id/'+caps_id;
		jQuery.getJSON(url+"&callback=?", function(videos) {
			$('div#curated_content div.ui-widget-content h3 a').text(topic_name);
			if (videos.length == 0){
				$( "<li></li>" ).text('No videos here yet! Why not add some! :)').appendTo( 'div#curated_content div.ui-widget-content ol' );
				return;
			}
			for (i in videos){
				video = videos[i];
				video_title = video['video_title'];
				video_url = video['video_url'];
				youtube_id = video['youtube_id'];
				exercise_title = video['exercise_title'];
				exercise_url = video['exercise_url']?video['exercise_url']:'#';
				ex_div='<div class="exercise" style="display: none"><a href="'+exercise_url+'">'+exercise_title+'</a></div>';
				$('div#curated_content div.ui-widget-content ol').append('<li id="'+youtube_id+'"><a href=\"'+video_url+'\">'+video_title+'</a><img src="images/close.png" onclick=\"$(this).closest(\'li\').remove()\"></img>'+ex_div+'</li>')
			}
			$( "div#curated_content ol" ).droppable({
				activeClass: "ui-state-default",
				tolerance: "pointer",
				hoverClass: "ui-state-hover",
				accept: ":not(.ui-sortable-helper)",
				drop: function( event, ui ) {
					$( this ).find( ".placeholder" ).remove();
					ui.helper.prevObject.css('color','red');
					href = ui.helper.prevObject.context.outerHTML.split('href="')[1].split('"')[0];
					youtube_id = ui.helper.prevObject.find('a').attr('id'); //hahahahaha wtf?!
					ex_div='<div class="exercise" style="display: none"><a href="#"></a></div>';
					txt = '<li id="'+youtube_id+'"><a href=\"'+href+'\">'+ui.draggable.text()+'</a><img src="images/close.png" onclick=\"$(this).closest(\'li\').remove()\"></img>'+ex_div+'</li>';
					$(txt).appendTo( this ).colorbox({iframe:true, href: href, width:"80%", height:"80%"});
				}
			}).sortable({
				items: "li:not(.placeholder)",
				update: function(){
					//alert($(this));
				},
				sort: function() {
					// gets added unintentionally by droppable interacting with sortable
					// using connectWithSortable fixes this, but doesn't allow you to customize active/hoverClass options
					$( this ).removeClass( "ui-state-default" );
				}
			});
		});
	});
});

var save = function(){//TODO: youtube_id gets loaded with the ka stuff, and stays when moved across.
	newline = '%0D%0A'; //this is the newline char in html for mailto. LF=%0A, CR=%0D, crlf=%0D$0A.
	csv = '"caps_id","video_id","exercise_title","exercise_url"'+newline;
	//Now we wish to save the contents of our list.
	//Our list resides at $('div.ui-widget-content li')
	caps_id = $('div#curated_content div.ui-widget-content').attr('id');
	console.log('found the caps_id to be '+caps_id);
	$('div#curated_content div.ui-widget-content li').each(function(){
		youtube_id = $(this).attr('id');
		exercise = $(this).find('div.exercise a');
		ex_title = exercise.text()?exercise.text():'NULL';
		ex_url = exercise.attr('href')!=='#'?exercise.attr('href'):'NULL';//looks like I swore in the middle there...
		csv += '"'+caps_id+'","'+youtube_id+'","'+ex_title+'","'+ex_url+'"'+newline;
	});
	example_text='"this","is","a"'+newline+'"small","simple","test"';
	h=csv.replace(/"/g,'%22').replace(/,/g,'%2C').replace(/ /g,'%20');
	console.log(h);
	window.location.href = 'mailto:jarednorman@hotmail.com?Subject=CAPS_ID_'+caps_id+'&body='+h;
	window.prompt ("Copy this to clipboard ( Ctrl+C or Cmd-C )\nThen send it to me (jarednorman@hotmail.com)", h);
}

function load_trees(){
	$( "#catalog" ).accordion();
	$( "#catalog li" ).draggable({
		revert: "true",
		appendTo: "body",
		helper: "clone"
	});
	$( "#ui-widget-content" ).accordion();
$('div.ui-accordion-content').css('height','auto');
}
	
function get_subtree(subtree_id,dest_selector,title_element){//picks topic with id=subtree_id and append <option> tag to $(dest_selector)
	//First, have just one option which reads 'loading' (disable the selector first) then load the new content into the selector
	url='http://www.khanacademy.org/api/v1/topic/'+subtree_id+'?';
	$('#refresh_button').attr('disabled','disabled');
	jQuery.getJSON(url+"callback=?", function(data) {
		topics = data['children'];
		$(dest_selector)
			.html($("<option></option>")
				.attr("value",'loading')
				.attr("class",'loading')
				.attr("disabled",'disabled')
				.text('Loading...'));
		for(var i in topics){//we search children of the root (aka, subjects)
			ka_topic_id = topics[i]['id'];
			ka_topic_title = topics[i]['title'];
			$(dest_selector)
			.append($("<option></option>")
			.attr("value",ka_topic_id)
			.text(ka_topic_title));
		}
		
		if(title_element){
			$(dest_selector + ' option.loading').text(title_element).attr('class','select_title').attr('value','select_title').attr('selected','selected').removeAttr("disabled");}
		else{
			$(dest_selector + ' option.loading').remove();}
		$(dest_selector).removeAttr("disabled");
	}).done(function(){$('#refresh_button').removeAttr('disabled');});
}
	
	
/*The following code sets up the ability to abort ajax requests 
 *as seen here http://stackoverflow.com/questions/1802936/stop-all-active-ajax-requests-in-jquery
 *I need to do this when refreshing the code, otherwise there's gonna be some rogue code injected into the DOM 
 D:
*/
	var xhrPool = [];
	$(document).ajaxSend(function(e, jqXHR, options){
		xhrPool.push(jqXHR);
	});
	$(document).ajaxComplete(function(e, jqXHR, options) {
		xhrPool = $.grep(xhrPool, function(x){
			return x!=jqXHR;
		});
	});
	var abort = function() {
		$.each(xhrPool, function(idx, jqXHR) {
			jqXHR.abort();
		});
	};
	var oldbeforeunload = window.onbeforeunload;
	window.onbeforeunload = function() {
	var r = oldbeforeunload ? oldbeforeunload() : undefined;
		if (r == undefined) {
		  // only cancel requests if there is no prompt to stay on the page
		  // if there is a prompt, it will likely give the requests enough time to finish
			abort();
		}
		return r;
	}
/*end code to abort ajax
 *So, now to stop everything, just call abort...
 */
function refresh_khan(topic_id){
	/**
	 * If nothing is passed in, sets the Khan Windows text to "Select Topic".
	 * Otherwise, sets it to 'loading' while the processing takes place...
	 *
	 * If topic_id has only videos, sets title to topic title and puts them in one list, 
	 * otherwise makes lists for each child of topic (which should be a subtopic and
	 * hence only have videos/exercises as children).
	 **/
	abort();//abort any current ajax_requests - may have to modify this to only abort KA requests...
	
	if(!topic_id || topic_id == 'select_title'){
		$('.khan_accordian_box').html('<h1 class="ui-widget-header">Select Khan topic above</h1>');
		return;	
	}
	$('.khan_accordian_box').html('<h1 class="ui-widget-header">Loading...</h1>');
	
	console.log('id:'+topic_id);
	url='http://www.khanacademy.org/api/v1/topic/'+topic_id+'?';
	$.ajax({url:url+"callback=?",dataType:'json',async:false}).done( function(data) {
		kids=data['children'];
		result = '<h1 class="ui-widget-header">Videos</h1>';
		result+= '\n<div id="catalog">\n';//TODO:replace the id of this div from catalog to something more meaningful
		
		/*begin in_construction*/
		
		videos_html='<h3><a href="#">'+'All'+' Videos</a></h3>\n';//todo - figure out what name to put here instead of 'All'
		videos_html+='<div><ul>\n';
		window.ajax_requests=0;
		window.topic_html = Array(kids.length);//an array of html topics. When we have all topics/videos, we join these to get our final html
		for (var i in kids){
			topic_html[i]=' ';
			topic_or_video = kids[i];
			if (topic_or_video['kind']=='Video'){
				video=topic_or_video;
				vid_id = video['youtube_id'];
				if (!vid_id){
								console.log('No URL for this video: ');
								console.log(video);}
				vid_title = video['title'];
				vid_url = video['ka_url'];
				if (!vid_url)
					vid_url = video['url'];
				txt = '<li><a id="'+vid_id+'" href="'+vid_url+'">'+vid_title+'</a></li>\n';
				videos_html+=txt;
			}
			if (topic_or_video['kind']=='Topic'){
				topic = topic_or_video;
				ajax_requests++;
				id=topic['id'];
				url='http://www.khanacademy.org/api/v1/topic/'+id+'/videos?';
				$.ajax({url:url+"callback=?&title="+topic['title']+"&i="+i,dataType:'json',async:true}).done( function(vid_data) {
					ajax_requests--;//this ones come back, so decrement the total outstanding ajax requests.
					title=this.url.split('title=')[1].split('&')[0];//hax
					i=this.url.split('i=')[1].split('&')[0];//hax
					
					//add the html
					if (vid_data.length>0){//sometimes a topic has no videos (eg, telling time).
						topic_html[i]+='<h3><a href="#">'+title+'</a></h3>\n';
						topic_html[i]+='  <div><ul>\n';
						for (j in vid_data){//for each video
							video=vid_data[j];
							vid_title = video['title'];
							vid_id = video['youtube_id'];
							if (!vid_id){
								console.log('No URL for this video: ');
								console.log(video);}
							vid_url = video['ka_url'];
							if (!vid_url)
								vid_url = video['url'];
							txt = '    <li><a id="'+vid_id+'" href="'+vid_url+'">'+vid_title+'</a></li>\n';
							topic_html[i]+=txt;
						}
						topic_html[i]+='  </ul></div>\n';
					}//end if (if theres no videos, we just ignore the topic.)
					//if this is the last ajax request
					if(ajax_requests == 0){
						//complete our 'all videos' div
						videos_html+='</ul></div>';
						if (videos_html.indexOf('<li')>=0)
							result+=videos_html;
						console.log(videos_html);
						for (var str_i in topic_html){
								result+=topic_html[str_i];//add this chunk of html to the result.
						}
						result+='</div>';
						console.log('i_FINAL = '+i);
						topic_html[i]+='</div>';
						$('div.khan_accordian_box').html(result);
						console.log('2:Result:');
						console.log(result);
						
						load_trees();
						
						$('a').click(function(){//TODO: fix colorbox to grab just videos.
							if (this.href.indexOf('khanacademy.org') > 0){
								$(this).colorbox({iframe:true, width:"80%", height:"80%"});
							}
						});
						return;
					}
				});//end ajax
			}
			if (topic_or_video['kind']!='Video' && topic_or_video['kind']!='Topic'){
				console.log('warning, element of kind '+topic_or_video['kind']);
			}
		}
		/*
		 * If there were no topics, then no ajax requests were sent out
		 * or, there were topics and the requests came back super quickly.
		 * In either case, we're in the situation to put the html together at this point.
		 * 
		 * */
		if(ajax_requests==0){
				
				videos_html+='</ul></div>';
				if (videos_html.indexOf('<li')>=0)
					result+=videos_html;
				console.log(videos_html);
				for (var str_i in topic_html){
						result+=topic_html[str_i];//add this chunk of html to the result.
				}
				result+='</div>';
				console.log('i_FINAL = '+i);
				topic_html[i]+='</div>';
				$('div.khan_accordian_box').html(result);
				console.log('2:Result:');
				console.log(result);
				
				load_trees();
				
				$('a').click(function(){//TODO: fix colorbox to grab just videos.
					if (this.href.indexOf('khanacademy.org') > 0){
						$(this).colorbox({iframe:true, width:"80%", height:"80%"});
					}
				});
				return;
			}
		
		
	});
		/*end in_construction*/
}//end refresh_khan()


function do_onready(){
	//get info from numeric db:
	
	get_subtree('root','select.khan_subject_box','Subjects:');//automatically load Subjects when webpage loads.
	//setup onChange event for Khan Subject
	$('select.khan_subject_box').change(function(){//when user selects a Subject from khan_subject_box
		$('select.khan_topic_box').attr('disabled','disabled');
		selected_id = $(this).val();//grab id of element selected
		if (selected_id=='select_title'){//if it's the header, then we want to disable everything.
			$('select.khan_topic_box option').not('option[value=select_title]').remove();}
		else{//if user selected a Subject which is not the header (more likely)
			get_subtree(selected_id,'select.khan_topic_box','Topics:');}//populate the Topics box next to this one.
	});
	//setup onChange event for Khan Topic
	$('select.khan_topic_box').change(function(){
		selected_id = $(this).val();//grab id of topic selected
		refresh_khan(selected_id);
		//refresh_khan($().val());//Refresh the videos list
		});
	refresh_khan($('select.khan_subject_box option[value=select_title]').val());
}
