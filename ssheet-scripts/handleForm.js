function createTimeDrivenTriggers() {
	ScriptApp.newTrigger('handleTheForm')
				.timeBased()
				.everyMinutes(1)
				.create()
	ScriptApp.newTrigger('deleteTriggerHandle')
		.timeBased()
		.after(1000 * 60 * 60 * 24)
		.create()
}

function handleTheForm() {
	// lineNumber -номер строки, в которой форма еще не проверена, но пройдена учеником
	var lineNumber
	var id_
	var form
	var formResponses
	var grade
	var gradeIdeal
	var gradeFinal
	var studentSheet
	var studentSheetName
	for (lineNumber = 2; lineNumber < 2000; lineNumber++) {
		// Если найдена форма
		if (formSheet.getRange("A" + lineNumber).getValue() !== "") {
			// Если Форма еще не обработана
			if (formSheet.getRange("B" + lineNumber).getValue() === "") {
				id_ = formSheet.getRange("A" + (lineNumber)).getValue()
				form = FormApp.openById(id_)
				formResponses = form.getResponses()
				grade = 0
				gradeIdeal = 0
				// Если на форму есть ответы
				if (formResponses.length > 0) {
					formSheet.getRange("B" + (lineNumber)).setValue("*")
					studentSheetName = formSheet.getRange("C" + (lineNumber)).getValue()
					studentSheet = currentSpreadsheet.getSheetByName(studentSheetName)
					// Проход по массиву formResponses. formResponse - текущий массив ответов от одного человека
					var formResponse = formResponses[formResponses.length - 1]
					// Массив ответов из formResponse
					var itemResponses = formResponse.getItemResponses()

					// Находим пустую строку на листе Ответы для записи ответов
					var lineNumberOfAnswer = answerSheet.getLastRow() + 1
					answerSheet.getRange(lineNumberOfAnswer, 2).setValue(id_)

					for (var i = 3; i <= studentSheet.getLastRow(); i++) {
						if (id_.toString() === studentSheet.getRange(i, 2).getValue().toString()) {
							var studentEmail = studentSheet.getRange(i, 1).getValue()
							answerSheet.getRange(lineNumberOfAnswer, 1).setValue(studentEmail)
						}
					}
					
					for (var j = 0; j < itemResponses.length; j++) {
						var itemResponse = itemResponses[j]
						answerSheet
							.getRange(lineNumberOfAnswer, 5 + j)
							.setValue(itemResponse.getResponse().toString())
						Logger.log(itemResponse.getItem().getTitle())
						if (isResponseCorrect(itemResponse) === true) {
							grade++
							answerSheet.getRange(lineNumberOfAnswer, 5 + j).setBackground('green')
						}
						else {
							answerSheet.getRange(lineNumberOfAnswer, 5 + j).setBackground('red')
						}
						gradeIdeal++
					}

					// Принимаем не более одного ответа
				  	form.setAcceptingResponses(false)
				  	gradeFinal = setGradeToTable(grade, gradeIdeal, lineNumberOfAnswer)

				  	setGradeToClassroom(gradeFinal, lineNumberOfAnswer, id_, studentSheet)
				}
			}
		}
		else {
			break
		}
	}
}

// Проверка текущего ответа (одного ответа) на правильность
function isResponseCorrect(resp) {
	var quest = resp.getItem().getTitle();
	quest = quest.slice(quest.indexOf('. ') + 2);
	var correct;
	var amountOfQuestionsInTable = questionSheet.getLastRow()
	for (var i = 2; i <= amountOfQuestionsInTable; i++) {
		if (questionSheet.getRange('B' + i).getValue() === quest) {
			var typeOfQuestion = questionSheet.getRange('D' + i).getValue()
			switch (typeOfQuestion) {
				case 'один':
					var num = questionSheet.getRange('E' + i).getValue();
					correct = questionSheet.getRange(String.fromCharCode(70 + num) + i).getValue().toString()
					if (resp.getResponse() === correct) {
						return true;
					}
					return false;
					break
				case 'строка':
					correct = questionSheet.getRange('E' + i).getValue().toString();
					if (correct === resp.getResponse().toString() || correct.toLowerCase() === resp.getResponse().toString()) {
						return true;
					}
					return false
					break
				case 'много':
					var correct = questionSheet.getRange('E' + i).getValue().toString();
					var answers = correct.split('');
					for (var q = 0; q < answers.length; q++) {
						answers[q] = questionSheet.getRange(String.fromCharCode(70 + Number(answers[q])) + i).getValue();
					}
					// Текущие ответы из формы
					var answersCurrent = resp.getResponse();

					// Сверка ответов
					var cnt = 0;
					for (var q = 0; q < answersCurrent.length; q++) {
						var index = answers.indexOf(answersCurrent[q]);
						if (index === -1) {
							return false;
						}
						else {
							cnt++;
						}
					}

					if (cnt === answers.length) {
						return true;
					}
					return false
					break
			}
			break;
		}
	}
}

function deleteTriggerHandle() {
	var triggers = ScriptApp.getProjectTriggers();

	for (var i = 0; i < triggers.length; i++) {
		ScriptApp.deleteTrigger(triggers[i]);
	}
}