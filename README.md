# Tractivity
Web application to help users track their fitness progress and set fitness goals. Created along with Mandeepika Saini (@mandeepika) and Keya Barve (@keyabarve).


## How it works

### Dashboard
Every user has a personalized dashboard displaying a bar graph of their weekly workouts based on the type of activity completed (default set to 'Walk'). Users can select any activity from a dropdown to reveal the bar graph of their workouts for that activity over the past week. They can also change the date from a date picker to reveal all their workouts for the selected activity during the week ending with the selected date.  

#### Reminders
The dashboard also displays a dismissable reminder for the next activity that the user is scheduled to complete. 

#### Badges
There are three types of badges:  
- Starter Spirit: Awarded to those who have finished at least 10 'easy' level workouts.
- Go Getter: Awarded to those who have finished at least 10 'medium' level workouts.
- Motivation Master: Awarded to those who have finished at least 10 'hard' level workouts.

### Logging Past Activities
Users can log their past activities along with the date, type of activity, and number of units of that activity completed. These will be stored in a database of past entries and displayed in a table under the 'Past Activities' tab. Each activity will be assigned a color-coded difficulty level (easy, medium, hard), keeping in mind that this app is intended for beginners just starting on their fitness journeys. Users can filter these entries by date and difficulty level. 

### Logging Future Goals
Users can log activities that they intend to complete on later dates. These will be stored in a database of future entries and displayed in list format under the 'Future Goals' tab. Users can filter these activities by date. They will also receive a reminder on their dashboard for the closest upcoming activity they have scheduled.


## Future plans for this project

### More Badges
The dashboard will display badges for weekly or monthly achievements, including:
- A badge for those who have completed at least one week of continuous workouts (any activity) without a break.
- A badge for those who have completed at least 30 days of continuous workouts (any activity) without a break.
- Other badges will be awarded based on specific activity (for example: walking for 10 continuous days, biking for 10 continuous days, etc.).

### Nutrition Tracker
This will be another tab where users can log their daily meals. They will then be shown on what levels of the food pyramid they have fulfilled, and what levels they still need nutrients in. 


## Download and run
To run this project, download the code and run the following command from the root directory of the application:

    node index.js

End-to-end testing has not yet been set up for this project, but this will be worked on as a future goal.

## Credits  
Special credits for initial idea, project name, starter code, database creation, logo design, and extra help go to:
- Professor Nina Amenta, UC Davis
- TAs David Bauer, Jia-Wei Liang, Rajat Jalal, Kyle Mitchell, and Vivian Pham
- Tutors Akshay Nama and Omar Burney  

This project would not have been possible without their guidance.


## Contact Me
I would love to hear any feedback or new ideas for this project! Please feel free to contact me at krithikagr@gmail.com.
