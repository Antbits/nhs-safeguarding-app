function moduleSurvey(path,filename,app_obj){
	var self = this;
	self.app_obj = app_obj
	self.messageData = {
		'action':null
	};					
	var api = 'https://www.myguideapps.com/admin/modules/survey/survey.api.php'
	var path = document.location.pathname;
	var directory = path.substring(path.indexOf('/'), path.lastIndexOf('/'));
	//api = 'http://localhost/myguide_v3/modules/survey/survey.api.php'
	var locked = false;
	$('form[name="survey"] .module-survey-hidden textarea').slideUp(0)
	$('form[name="survey"] .module-survey-hidden h3').hide()
	$('form[name="survey"] .module-survey-hidden textarea').each(function(index, element) {
		var radio_group = $(element)[0].name.split('-')[0];
		$('#radio-group-'+radio_group+' input').click(function(e){
			var group_id = e.target.id.split('-')[0]
			var hidden_areas = $('.module-survey-hidden textarea[name = "'+e.target.id+'"]')
			if(hidden_areas.length>0){
				showHiddenInput($(hidden_areas[0]),group_id,e.target.id)
			}else{
				showHiddenInput(null,group_id,e.target.id)
			}
		})      
    });
	/*$("form[name='survey']").submit(function(e){
			e.preventDefault();
			module_obj.validate()
			return false;
		}
	)*/
	$("form[name='survey'] input[type = submit]").click(function(e){
		e.preventDefault();
		module_obj.validate()
		return false;
	})
	$('form[name="survey"] textarea').on('keyup',function(e){
		if(e.target.value != ''){
			$(e.target.parentNode).removeClass('invalid')
		}
	})
	$('form[name="survey"] input[type = "radio"]').on('click',function(e){
		$(e.target.parentNode.parentNode).removeClass('invalid')
		
	})
	if(app_obj.mode === 'app'){
		if(filename === 'index.html'){
			self.messageData.action='get_surveys'
			window.ReactNativeWebView.postMessage(JSON.stringify(self.messageData));
		}
		$('#survey-complete').click(function(e){
			//Ti.App.fireEvent('app:closeSurvey', {redirect:e.target.href});
			self.messageData.action='close_survey'
			window.ReactNativeWebView.postMessage(JSON.stringify(self.messageData));
			e.preventDefault();
		})
		$('.survey-redirect').click(function(e){
			//Ti.App.fireEvent('app:closeSurvey', {redirect:e.target.href});
			self.messageData.action='redirect_survey'
			window.ReactNativeWebView.postMessage(JSON.stringify(self.messageData));
			e.preventDefault();
		})
	}
	function showHiddenInput($target,group_id,target_id){
		showHideLabels()
		if(!locked){
			locked=true;
			var speed = 300;
			if($target === null){
				$('#radio-group-'+group_id+' textarea').stop().slideUp(speed)
				
			}else{
				$target.parent().siblings().each(function(index,element){
					if($(element).hasClass('module-survey-hidden')){
						var $textarea = $($(element).find('textarea')[0])
						if($textarea.css('display') !== 'none'){
							speed = 0;
						}
					}
				})
				
				if($target.css('display') === 'none' && speed > 0){
					$target.stop().slideDown(speed)
					$('#'+target_id).stop().show()
				}
				if(speed === 0){
					$('#radio-group-'+group_id+' textarea').stop().slideUp(0)
					$target.stop().slideDown(0)
				}
			}
			showHideLabels()
			setTimeout(function(){
				showHideLabels()
				locked = false
			},(10+speed))
		}
	}
	function showHideLabels(){
		$("form[name='survey'] textarea").each(function(index, element) {
			var $node = $(element)[0]
			if($(element).css('display') === 'none'){
				$('#label-'+$node.name).hide()
			}else{
				$('#label-'+$node.name).show()
			}         
        });
	}
	//showHideLabels();
	function getOrdinalNum(n) {
	  return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
	}
	this.setSurveys = function(surveys){
		//Ti.App.removeEventListener("app:setSurveyData", setSurveys);
		$('#module-survey-completed').html('')
		for(var i in surveys){
			if(surveys[i].withdraw_id != null){
				var d = new Date(surveys[i].timestamp)
				var $node = '<div><p>Survey completed '+getOrdinalNum(d.getDate())+' '+d.toLocaleString('default', { month: 'long' })+' '+d.getFullYear()+'</p><button id = "module-survey-'+surveys[i].withdraw_id+'">Remove survey data</button></div>';
				$('#module-survey-completed').append($node)
			}
		}
		$('#module-survey-completed button').on('click',function(e){
			//Ti.App.addEventListener("app:setSurveyData", setSurveys);
			//Ti.App.fireEvent("app:withdrawSurvey",{'id':e.target.id.replace('module-survey-','')});
			self.messageData.action='withdraw_survey'
			self.messageData.id=e.target.id.replace('module-survey-','')
			window.ReactNativeWebView.postMessage(JSON.stringify(self.messageData));
		});
	}
	if(app_obj.mode === 'app'){
		//Ti.App.removeEventListener("app:setSurveyData", setSurveys);
	}
	if($('#module-survey-completed').length > 0){
		//Ti.App.addEventListener("app:setSurveyData", setSurveys);
		//Ti.App.fireEvent("app:getSurveyData");
		
	}
	if(app_obj.mode === 'web'){
		var url_vars = getUrlVars();
		if(url_vars.hasOwnProperty('withdraw_id')){
			$('body').html($('body').html().split('{{withdraw_id}}').join(url_vars.withdraw_id))
		}
	}
	this.errorMsg = function(str){
		$('#module-survey-error').html(str).stop().fadeIn(300)
		window.scroll({
		  top: 0, 
		  left: 0, 
		  behavior: 'smooth'
		});
	}
	this.validate = function(){
		var valid = false;
		var output = {};
		$("form[name='survey'] textarea").each(function(index, element) {
			var $node = $(element)[0]
			if($(element).val() === ''){
				$($($node)[0].parentNode).addClass('invalid')
			}else{
				valid = true;
				$($($node)[0].parentNode).removeClass('invalid')
				output[$node.name] = {"val":$(element).val(),"type":"textarea"};
			}         
        });
		$('form[name="survey"] input[type = "radio"]').each(function(index, element) {
			var $node = $(element)[0]
			if(!output.hasOwnProperty($node.name)){
				output[$node.name] = {"val":$("input:radio[name ='"+$node.name+"']:checked").val(),"type":"radio"};
				if(typeof output[$node.name].val !== 'undefined'){
					valid = true;
				}
			}
		})
		for(var i in output){
			if(output[i].type === 'radio' && typeof output[i].val === 'undefined'){
				$('#radio-group-'+i).addClass('invalid')
			}
			if(output[i].type === 'radio' && typeof output[i].val !== 'undefined'){
				$('#radio-group-'+i).removeClass('invalid')
			}
		}
		if(valid){
			$('#module-survey-error').stop().fadeOut(300)
			if(app_obj.mode === 'app'){
				//Ti.App.fireEvent('app:submitSurvey', {formdata: output,redirect:'complete.html'});
				app_obj.messageData.action = "submit_survey";
				app_obj.messageData.data = output;
				//self.getParentLink(event.target).href
				app_obj.messageData.destination = directory+'/complete.html';
				app_obj.messageData.scrollpos = $('body').scrollTop();
				window.ReactNativeWebView.postMessage(JSON.stringify(app_obj.messageData));
			}else{
				//console.log(output)
				//console.log(JSON.stringify(output))
				$.getJSON(api+'?project_id='+self.app_obj.project_id+'&form_data='+encodeURIComponent(JSON.stringify(output)), function(data) {
					if(data.success){	
						window.location.href = 'complete.html?withdraw_id='+data.withdraw_id;
					}else{
						self.errorMsg(module_survey_strings.api_error_msg)
					}
				}).fail(function(){
					self.errorMsg(module_survey_strings.api_error_msg)
				})
			}
		}else{
			self.errorMsg(module_survey_strings.incomplete_form_msg)
		}
	}
}