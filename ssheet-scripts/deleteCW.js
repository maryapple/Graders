// Это функция очистки ВСЕХ вопросов на курсе, предназначена для тестового курса


function deleteCW() {
	var arr = Classroom.Courses.CourseWork.list(courseId).courseWork
    for each (var cw in arr) {
		Classroom.Courses.CourseWork.remove(courseId, cw.id)
	}
}
