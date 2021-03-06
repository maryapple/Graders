var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
var questionSheet = currentSpreadsheet.getSheetByName("Вопросы");
var answerSheet = currentSpreadsheet.getSheetByName("Ответы");
var formSheet = currentSpreadsheet.getSheetByName("Формы");
// var studentSheet = currentSpreadsheet.getSheetByName("Студенты");
var studentTESTSheet = currentSpreadsheet.getSheetByName("СтудентыTEST");
var studentSheet;
// var studentSheet = studentTESTSheet;

function onOpen(e) {
	var menu = SpreadsheetApp.getUi().createAddonMenu();
	// menu.addItem('Создать формы для группы', 'makeFormForGroup');
	menu.addItem('test', 'test');
	menu.addItem('БИВ181', 'group181');
	menu.addItem('БИВ182', 'group182');
	menu.addItem('БИВ183', 'group183');
	menu.addItem('БИВ184', 'group184');
	menu.addItem('БИВ185', 'group185');
	menu.addItem('БИВ186', 'group186');
	menu.addToUi();
}

function test() {
	studentSheet = currentSpreadsheet.getSheetByName("СтудентыTEST");
	makeFormForGroup(studentSheet);
}

function group181() {
	studentSheet = currentSpreadsheet.getSheetByName("СтудентыБИВ181");
	makeFormForGroup(studentSheet);
}

function group182() {
	studentSheet = currentSpreadsheet.getSheetByName("СтудентыБИВ182");
	makeFormForGroup(studentSheet);
}

function group183() {
	studentSheet = currentSpreadsheet.getSheetByName("СтудентыБИВ183");
	makeFormForGroup(studentSheet);
}

function group184() {
	studentSheet = currentSpreadsheet.getSheetByName("СтудентыБИВ184");
	makeFormForGroup(studentSheet);
}

function group185() {
	studentSheet = currentSpreadsheet.getSheetByName("СтудентыБИВ185");
	makeFormForGroup(studentSheet);
}

function group186() {
	studentSheet = currentSpreadsheet.getSheetByName("СтудентыБИВ186");
	makeFormForGroup(studentSheet);
}

// Generates array of random values
function makeRandomNumbers() {
	var arr = [];
	// Numeration begins from second row, NOT the first!!!!
	arr.push(randomNum(2, 25));
	arr.push(randomNum(26, 35));
	arr.push(randomNum(36, 43));
	return arr;
}

// Generates a number between min, max
function randomNum(min, max) {
	var rand = min - 0.5 + Math.random() * (max - min + 1);
  	return Math.round(rand);
}

function makeObject(index) {
	var qId = questionSheet.getRange('A' + index).getValue();
	var question = questionSheet.getRange('B' + index).getValue();
	var typeOfQuestion = questionSheet.getRange('D' + index).getValue();
	
	var answers = [];
	var amountOfAnswers = questionSheet.getRange('F' + index).getValue();
	for (var i = 0; i < amountOfAnswers; i++) {
		answers[i] = questionSheet.getRange(index, 7 + i).getValue();
	}

	var correctAnswer = questionSheet.getRange('E' + index).getValue();

	var obj = {
		id: qId,
		question: question,
		type: typeOfQuestion,
		answers: answers,
		amountOfAnswers: amountOfAnswers,
		correctAnswer: correctAnswer
	};

	return obj;
}

function makeQuestionset() {
	var array = makeRandomNumbers();  // Array of 5 random values
	var questionset = {}; // Object hat contains a line with question
	var dataset = []; // Array of 5 questionets

	for (i in array) {
		var ind = array[i];
		questionset = makeObject(ind);
		dataset.push(questionset);
	}
	return dataset;
}

// Create unique form for one person
function makeForm(studentEmail, studentSheet) {
	var dataset = makeQuestionset();
	var formName = 'Экзамен' + ' - ' + studentEmail;
    var form = FormApp.create(formName);
	var formId = form.getId();

	var file = DriveApp.getFileById(formId);
	var parents = file.getParents();
	while (parents.hasNext()) {
		var parent = parents.next();
		parent.removeFile(file);
	}
	DriveApp.getFolderById('1BVA2dEKB6xDf-WBo2gBI2HISNHw37KXW').addFile(file);

    form.setLimitOneResponsePerUser(true);
    form.setRequireLogin(true);

    for (var i = 0; i < 3; i++) {
    	var item;
    	var imgId;
    	var arr = [];
    	if (dataset[i].type == "много") {
	    	item = form.addCheckboxItem();
	    	item.setTitle(i + 1 + ". " + dataset[i].question);
	    	item.setChoiceValues(dataset[i].answers);
		}
    	else if (dataset[i].type == "один") {
	    	item = form.addMultipleChoiceItem();
    		item.setTitle(i + 1 + ". " + dataset[i].question);
    		item.setChoiceValues(dataset[i].answers);
    	}
    	else if (dataset[i].type == "строка") {
			form.addTextItem()
	    		.setTitle(i + 1 + ". " + dataset[i].question);
    	}
    }

    PropertiesService.getScriptProperties().setProperty("tempId", formId);

	// Записываем Id формы и группу на лист Формы
    var lineNumber = formSheet.getLastRow() + 1;
	formSheet.getRange("A" + lineNumber).setValue(formId);
	formSheet.getRange("C" + lineNumber).setValue(studentSheet.getName());
    return formId;
}

function createTimeDrivenTriggers() {
	ScriptApp.newTrigger('handleTheForm')
				.timeBased()
				.everyMinutes(1)
				.create();
}

function handleTheForm() {
	// lineNumber -номер строки, в которой форма еще не проверена, но пройдена учеником
	var lineNumber;
	var id_;
	var form;
	var formResponses;
	var grade = 0;
	var gradeFinal;
	var studentSheet;
	var studentSheetName;
	for (lineNumber = 2; lineNumber < 2000; lineNumber++) {
		// Если найдена форма
		if (formSheet.getRange("A" + lineNumber).getValue() !== "") {
			// Если Форма еще не обработана
			if (formSheet.getRange("B" + lineNumber).getValue() === "") {
				id_ = formSheet.getRange("A" + (lineNumber)).getValue();
				form = FormApp.openById(id_);
				formResponses = form.getResponses();
				grade = 0;
				// Если на форму есть ответы
				if (formResponses.length > 0) {
					formSheet.getRange("B" + (lineNumber)).setValue("*");
					studentSheetName = formSheet.getRange("C" + (lineNumber)).getValue();
					studentSheet = currentSpreadsheet.getSheetByName(studentSheetName);
					var formResponse = formResponses[formResponses.length - 1]; // Проход по массиву formResponses. formResponse - текущий массив ответов от одного человека
					var itemResponses = formResponse.getItemResponses(); // Массив ответов из formResponse

					// Находим пустую строку на листе Ответы для записи ответов
					var lineNumberOfAnswer = answerSheet.getLastRow() + 1;
					answerSheet.getRange(String.fromCharCode(65) + lineNumberOfAnswer).setValue(id_);
					for (var j = 0; j < itemResponses.length; j++) {
						var itemResponse = itemResponses[j];
						answerSheet.getRange(String.fromCharCode(65 + j + 1) + lineNumberOfAnswer).setValue(itemResponse.getResponse().toString());
						if (isResponseCorrect(itemResponse) === true) {
							grade++;
						}
					}
					// Принимаем не более одного ответа
				  	form.setAcceptingResponses(false);

				  	gradeFinal = setGradeToTable(grade, lineNumberOfAnswer);

				  	setGradeToClassroom(gradeFinal, lineNumberOfAnswer, id_, studentSheet);
				}
			}	
		} else {
			break;
		}
	}
}

// Проверка текущего ответа (одного ответа) на правильность
function isResponseCorrect(resp) {
	var quest = resp.getItem().getTitle();
	quest = quest.slice(3);
	var correct;
	// Logger.log('The quest from FORM: ' + quest);
	// Ищем на странице с пулом вопросом идентичный вопрос
	for (var i = 2; i < 100; i++) {
		if (questionSheet.getRange('B' + i).getValue() === quest) {

			if (questionSheet.getRange('D' + i).getValue() === 'один') {
				var num = questionSheet.getRange('E' + i).getValue();
				correct = questionSheet.getRange(String.fromCharCode(70 + num) + i).getValue();
				/*Logger.log('The correct resp: ' + correct);
				Logger.log('The current resp: ' + resp.getResponse());*/
				if (resp.getResponse() === correct) {
					return true;
				}
				else {
					return false;
				}
			}

			else if (questionSheet.getRange('D' + i).getValue() === 'строка') {
				// Logger.log('The correct: ' + questionSheet.getRange('E' + i).getValue().toString() + '\nThe current resp: ' + resp.getResponse().toString());
				correct = questionSheet.getRange('E' + i).getValue().toString();
				if (correct === resp.getResponse().toString() || correct.toLowerCase() === resp.getResponse().toString()) {
					return true;
				}
				else {
					return false;
				}
			}

			else if (questionSheet.getRange('D' + i).getValue() === 'много') {
				// Формируем массив, состоящий из правильных ответов (не из цифровой комбинаций, а из значений ответов, соотв. этой комбинации)
				var strCorr = questionSheet.getRange('E' + i).getValue().toString();
				var answers = strCorr.split('');
				for (var q = 0; q < answers.length; q++) {
					answers[q] = questionSheet.getRange(String.fromCharCode(70 + Number(answers[q])) + i).getValue();
				}
				// Текущие ответы из формы
				var answersCurrent = resp.getResponse();

				// Logger.log('Correct answ: ' + answers + '\nCur resp: ' + answersCurrent);

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
					// Logger.log('response is correct 3');
					return true;
				}
				else {
					return false;
				}
			}
			break;
		}
	}
}

// Выставление оценки в таблицу
function setGradeToTable(grade, lineNumberOfAnswer) {
	var gradeFinal = 0;
	switch (grade) {
		case 0:
			gradeFinal = 0;
			break;
		case 1:
			gradeFinal = 4;
			break;
		case 2:
			gradeFinal = 7;
			break;
		case 3:
			gradeFinal = 10;
			break;
	}
	answerSheet.getRange("G" + lineNumberOfAnswer).setValue(gradeFinal * 10);
	answerSheet.getRange("H" + lineNumberOfAnswer).setValue(gradeFinal);
	return gradeFinal;
}

function makeFormForGroup(studentSheet) {
	var amountOfPeople = studentSheet.getLastRow() + 1;
	var studentEmail;
	var formId;
	var cwId;
	var id;
	for (var i = 3; i < amountOfPeople; i++) {
		studentEmail = studentSheet.getRange('A' + i).getValue();
		id = makeForm(studentEmail, studentSheet);
		studentSheet.getRange('B' + i).setValue(id);
		cwId = createCW(id, studentEmail, i, studentSheet);
		studentSheet.getRange('E' + i).setValue(cwId);
	}
}