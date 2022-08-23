# MQWidgets2

Mathematical activity widgets based on [Mathquill](http://mathquill.com/) textareas.

See a demonstration at [https://piworld.es/iedib/mqwidgets](https://piworld.es/iedib/mqwidgets)

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
<p data-mq="<Paste mq definition here>">Kate has $12 and gave $7 to his brother. How many dollars has Kate now?</p>
</div>
<!--We assume that jQuery and MathJax are already loaded in page. This is usually the case in Moodle. 
Please note that in Moodle, at least one formula \(..\) has to be in the document in order to have MathJax active.-->
<!--Add the dependency -->
<script src="https://piworld.es/iedib/matheditor/mqwidgets2.js"></script>
```

The definition of a ```mq``` widget is given through the data atribute ```data-mq``` which is encoded as a base64 string. The easiest way to create a new widget is by using the online editor at [https://piworld.es/iedib/mqwidgets](https://piworld.es/iedib/mqwidgets).