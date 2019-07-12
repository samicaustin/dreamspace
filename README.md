# dream-blog-analyzer
Concept: Users can input their dreams in the morning and receive quick keyword based insights.

## MVP:
1. Users must sign up and login in order to access site.
2. Users can create new dreams.
3. Users can view created dreams.
4. Users can edit their dreams.
5. Users can view the interpretation of their dreams.

## Extras:
1. Allow users to make dreams public or private. Public dreams can be searched by other users.
2. Use someone else's db of keywords/dream interpretations
3. Keyword "leaderboard" for public and also profile/personal dreams 
4. Super stretch goal - web scraper for dream keywords


## User Stories
* Register account
* Login 
* Go to create new dream page
  - Describe dream and/or select keywords from drop down
* Post dream and receive intepretation results on show page, option to edit dream here
* Private profile page to view previously submitted dreams and edit profile
* Logout


## Destiny's Duties:
* Users Schema, model, controller, and views
* Raw data for dream analysis
* Authenticiation and bcryptjs
* Bootstrap and CSS master

## Sami's Duties:
* Dream schema, model, controller, and views
* Raw data for dream analysis
* Polishing dream interpretation wording and feedback
* Wants to learn/do more style stuff

## Jake's Duties:
* Keyword schema, model, controller, and views
* Raw data for dream analysis
* Write the Regex search criteria and keyword extractor via Mongoose for dreamblog posts
* Make sure the DatePicker displays dates from DB properly
* Write middleware requireLogin and Partials

## Team Duties:
* db setup and keyword info
* server.js 

  ![wireframes](wireframes/dream-app-wireframes-01.png)
  ![wireframes](wireframes/dream-app-wireframes-02.png)  
  ![wireframes](wireframes/dream-app-wireframes-03.png)