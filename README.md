# FireCore

FireCore is designed to be a drop-in [DataSource](http://docs.sproutcore.com/#doc=SC.DataSource&src=false)
for [SproutCore](http://sproutcore.com) that uses [Firebase](http://firebase.com) as the back-end to store
your data.

It's super-easy, and super-fast to get started!

## Example Application

If you just want to play around with FireCore/Firebase, clone the example application,
[BigFlames](https://github.com/profoundry-us/BigFlames) and just run `sproutcore server`.

## Getting Started

Using FireCore in your own app is very easy, but we'll walk you through the entire process from start to finish.

1. First [sign up](https://www.firebase.com/signup/) for a Firebase account, then create your app by entering
a name in the App Name field.

    ![Firebase Sign Up](https://dl.dropbox.com/s/sm3mbbcmfdyz20j/firebase-signup.png)

1. Click on your new app, and you will see a fairly blank screen with a section showing all of the data in
your application. Currently, that would just be the empty, root node.

    ![Firebase Data](https://dl.dropbox.com/s/zt96r3piyb9dve9/firebase-data.png)

    Now you're ready to setup your project to work with FireCore:

1. Next, clone this project into the `frameworks` directory of your SproutCore application:

        cd MyProject
        mkdir -p frameworks/firecore
        git clone https://github.com/profoundry-us/FireCore.git frameworks/firecore

1. Edit your app's `Buildfile` to require it:

        config :my_app, :required => [:sproutcore, :firecore]

1. Generate a data source:

        sproutcore gen data-source MyApp.MyDataSource

1. Edit the data source to use FireCore:

        MyApp.MyDataSource = FireCore.DataSource.extend({
          firebaseApp: "myfirebaseapp"
        });

1. Edit your app's `core.js` file to use the new data source:

        SC.Store.create().from('MyApp.MyDataSource')

1. Define a model:

        MyApp.MyModel = SC.Record.extend({
          title: SC.Record.attr(String),
          isHot: SC.Record.attr(Boolean, { default: YES })
        });

1. Start your server and start creating content!

        MyApp.store.createRecord(MyApp.MyModel, { title: "FireCore rocks!", isHot: YES });
        MyApp.store.commitRecords();

When you look at your Firebase App's data view, you'll see your data appear magically!

## Notes

By default, Firebase data is fully open. That means that if someone has your URL, they can read your
data. This is generally not a good idea, so you'll want to add some Security Rules to your app to
protect your data.

## Issues

If you run into any problems when using FireCore, please [submit a new issue](https://github.com/profoundry-us/FireCore/issues)
and we'll get right on it!
