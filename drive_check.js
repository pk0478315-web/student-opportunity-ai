const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

async function checkDrivingEligibility() {
  const rl = readline.createInterface({ input, output });

  try {
    const answer = await rl.question('Enter your age: ');
    const age = parseFloat(answer.trim());

    if (isNaN(age) || age < 0) {
      console.log('Please enter a valid number for age.');
    } else if (age >= 18) {
      console.log('yes you can drive');
    } else {
      console.log('no you can not drive');
    }
  } finally {
    rl.close();
  }
}

checkDrivingEligibility();
