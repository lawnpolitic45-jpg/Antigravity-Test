function doPost(e) {
  var output = { success: false };
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'GET_TOTAL_COUNT') {
      var sheet = ss.getSheetByName('题目');
      var lastRow = sheet.getLastRow();
      output.success = true;
      output.total = lastRow > 1 ? lastRow - 1 : 0;
    } 
    else if (action === 'GET_QUESTIONS') {
      var sheet = ss.getSheetByName('题目');
      var dataRange = sheet.getDataRange().getValues();
      var count = data.count || 5;
      var questions = [];
      
      if (dataRange.length > 1) {
        var allQuestions = dataRange.slice(1);
        allQuestions.sort(function() { return 0.5 - Math.random() });
        var selected = allQuestions.slice(0, count);
        
        for (var i = 0; i < selected.length; i++) {
          var row = selected[i];
          questions.push({
            questionId: row[0],
            question: row[1],
            options: {
              A: row[2],
              B: row[3],
              C: row[4],
              D: row[5]
            }
          });
        }
      }
      output.success = true;
      output.questions = questions;
    }
    else if (action === 'SUBMIT_ANSWERS') {
      var sheet = ss.getSheetByName('题目');
      var dataRange = sheet.getDataRange().getValues();
      var qMap = {};
      for (var i = 1; i < dataRange.length; i++) {
        qMap[dataRange[i][0]] = dataRange[i][6];
      }
      
      var id = data.id;
      var answers = data.answers; 
      var totalTimeInt = data.totalTime || 0;
      
      var score = 0;
      var evaluations = [];
      for (var j = 0; j < answers.length; j++) {
        var a = answers[j];
        var correct = qMap[a.questionId];
        var isCorrect = (a.answer == correct);
        if (isCorrect) score++;
        evaluations.push({
          questionId: a.questionId,
          yourAnswer: a.answer,
          isCorrect: isCorrect,
          correctAnswer: correct
        });
      }
      
      var userSheet = ss.getSheetByName('回答');
      var userData = userSheet.getDataRange().getValues();
      var rowIndex = -1;
      
      for (var r = 1; r < userData.length; r++) {
        if (userData[r][0] == id) {
          rowIndex = r + 1;
          break;
        }
      }
      
      var formatNumber = function(num) {
         return num < 10 ? '0' + num : num.toString();
      };
      var formatTotalTime = function(sec) {
         var m = Math.floor(sec / 60);
         var s = sec % 60;
         return formatNumber(m) + ":" + formatNumber(s);
      };
      var timeStr = "'" + formatTotalTime(totalTimeInt);
      var now = new Date();
      var playTimeStr = now.toLocaleString();
      
      if (rowIndex > -1) {
        var playCount = userData[rowIndex - 1][1] + 1;
        var totalScore = userData[rowIndex - 1][2] + score;
        var highestScore = userData[rowIndex - 1][3];
        var bestTime = userData[rowIndex - 1][4];
        
        var shouldUpdateBestTime = false;
        if (score > highestScore) {
          highestScore = score;
          shouldUpdateBestTime = true;
        } else if (score == highestScore) {
          var bestSeconds = Infinity;
          if (bestTime) {
            var strVal = String(bestTime).replace(/^'/, '');
            var parts = strVal.split(":");
            if (parts.length === 2) {
              bestSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            }
          }
          if (totalTimeInt < bestSeconds) {
             shouldUpdateBestTime = true;
          }
        }
        
        if (shouldUpdateBestTime) {
          bestTime = timeStr;
        }
        
        userSheet.getRange(rowIndex, 2, 1, 5).setValues([[
          playCount, 
          totalScore, 
          highestScore, 
          bestTime,
          playTimeStr
        ]]);
      } else {
        userSheet.appendRow([
          id,
          1,
          score,
          score,
          timeStr,
          playTimeStr
        ]);
      }
      
      output.success = true;
      output.score = score;
      output.passed = score >= Math.ceil(answers.length * 0.6);
      output.evaluations = evaluations;
    }
  } catch (err) {
    output.error = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}
