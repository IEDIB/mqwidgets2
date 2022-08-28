# MQWidgets2

Mathematical activity widgets based on [Mathquill](http://mathquill.com/) textareas.

You can find some examples at [https://iedib.github.io/mqwidgets2/docs](https://iedib.github.io/mqwidgets2/docs?v=1.0)

## Basic usage

All widgets must be enclosed into a group which will send all the user's answers for verification.

```html
<div class="pw-mq-group">
···
</div>
```

To add a widget simply use the following markup

```html
<div class="pw-mq-group">
<p id="mqw_kj23kw90" data-mq="<Paste mq definition here>">Kate has $12 and gave $7 to his brother. How many dollars has Kate now?</p>
</div>
<!--We assume that jQuery and MathJax are already loaded in page. This is usually the case in Moodle. 
Please note that in Moodle, at least one formula \(..\) has to be in the document in order to have MathJax active.-->
<!--Add the dependency -->
<script src="https://iedib.github.io/mqwidgets2/dist/mqwidgets2.js"></script>
<!--Initialize and configure-->
<script>
MQWidgets.init({
    lang: 'en',
    widgets: {
        'mqw_kj23kw90': '<Paste mq definition here>'
    },
    engines: ['https://piworld.es/mqwdemo/api/', 'nerdamer']
})
</script>
```

The definition of the widget can be done inline with the HTML code through the ```data-mq``` atrribute or by declaring the ```id``` in the init call.
 
 In any case, the easiest way to create a new widget is by using the online editor at [https://iedib.github.io/mqwidgets2-editor/dist](https://iedib.github.io/mqwidgets2-editor/dist).

In order to process widgets that are dynamically added to the page, the client must call the method
```MQWidgets.reflow()```.

### Initialization options

- lang? = 'en' | 'es' | 'ca': The language of the GUI. If this option is not specified, the detected browser language is used with fallback 'en'.

- engine[] = The URL that gives access to the CAS backend or the literal 'nerdamer'. You can use ```https://piworld.es/mqwdemo/api/``` solely for demo purposes. Please, do not use this backend for production since it limits the number of requests.  
In the future, this option will also allow to execute a reduced version of the CAS in the browser without the need to setup a backend server. The first item in the list will be the default engine used.

- mqwBaseurl? = The url of your distribution of the MQWidgets library. By default it is set to ```https://iedib.github.io/mqwidgets2/dist/```, but you are free to host your own copy of the dist folder. Bear in mind, that the Mathquill dependency must be located at ```/lib/mathquill.matrix.min.js``` relative to the *dist* URL.

- widgets?: {
        'mqw_kj23kw90': '<Paste mq definition here>'
}  
It contains a dictionary with the ids of the widgets and their definition in Base64 encoding. 
