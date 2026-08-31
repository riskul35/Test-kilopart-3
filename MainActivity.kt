package com.tacherontonnage.app

import android.content.Intent
import android.os.Bundle
import android.view.Gravity
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import java.text.SimpleDateFormat
import java.util.*

data class Worker(val name:String, var percent:Double)

class MainActivity: AppCompatActivity() {
    private val workers = mutableListOf<Worker>()
    private lateinit var tonnage: EditText
    private lateinit var price: EditText
    private lateinit var count: EditText
    private lateinit var container: LinearLayout
    private lateinit var result: TextView

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        buildUi()
        rebuildWorkers()
    }

    private fun buildUi() {
        val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(28,22,28,22)}
        val title=TextView(this).apply{text="TACHERON TONNAGE";textSize=25f;gravity=Gravity.CENTER;fontWeight()}
        root.addView(title, lp())
        root.addView(label("Calcul du tonnage d'équipe"))
        tonnage=field("Tonnage total (kg)", "5000"); root.addView(tonnage, lp())
        count=field("Nombre de désosseurs", "5"); root.addView(count, lp())
        price=field("Prix au kg (€)", "0.02390"); root.addView(price, lp())
        val rebuild=Button(this).apply{text="Créer / actualiser l'équipe";setOnClickListener{rebuildWorkers()}}
        root.addView(rebuild, lp())
        container=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL}
        root.addView(container, lp())
        val calc=Button(this).apply{text="CALCULER";setOnClickListener{calculate()}}
        root.addView(calc, lp())
        result=TextView(this).apply{textSize=17f;setPadding(0,20,0,20)}
        root.addView(result, lp())
        val share=Button(this).apply{text="PARTAGER LE RÉSULTAT";setOnClickListener{shareResult()}}
        root.addView(share, lp())
        setContentView(ScrollView(this).apply{addView(root)})
    }
    private fun TextView.fontWeight(){ setTypeface(typeface, android.graphics.Typeface.BOLD) }
    private fun label(s:String)=TextView(this).apply{text=s;textSize=18f;setPadding(0,18,0,8)}
    private fun field(h:String,v:String)=EditText(this).apply{hint=h;setText(v);inputType=2 or 8192}
    private fun lp()=LinearLayout.LayoutParams(-1,-2).apply{bottomMargin=8}

    private fun rebuildWorkers(){
        val n=count.text.toString().toIntOrNull()?.coerceIn(1,20)?:5
        while(workers.size<n) workers.add(Worker("Personne ${workers.size+1}",100.0))
        while(workers.size>n) workers.removeAt(workers.lastIndex)
        container.removeAllViews()
        workers.forEachIndexed{ i,w->
            val row=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL}
            val name=EditText(this).apply{setText(w.name);hint="Nom";layoutParams=LinearLayout.LayoutParams(0,-2,2f)}
            val pct=EditText(this).apply{setText(w.percent.toString().removeSuffix(".0"));hint="%";inputType=2 or 8192;layoutParams=LinearLayout.LayoutParams(0,-2,1f)}
            name.setOnFocusChangeListener{_,has->if(!has)workers[i].copy(name=name.text.toString())}
            pct.setOnFocusChangeListener{_,has->if(!has)workers[i].percent=pct.text.toString().toDoubleOrNull()?:100.0}
            row.addView(name);row.addView(pct);container.addView(row)
        }
    }
    private fun calculate(){
        workers.forEachIndexed{ i,w->
            val row=container.getChildAt(i) as LinearLayout
            val name=row.getChildAt(0) as EditText
            val pct=row.getChildAt(1) as EditText
            w.percent=pct.text.toString().toDoubleOrNull()?:100.0
            workers[i].name=name.text.toString().ifBlank{"Personne ${i+1}"}
        }
        val kg=tonnage.text.toString().replace(",",".").toDoubleOrNull()?:0.0
        val p=price.text.toString().replace(",",".").toDoubleOrNull()?:0.02390
        val points=workers.sumOf{it.percent.coerceAtLeast(0.0)}
        if(points<=0 || kg<0){result.text="Vérifie les valeurs.";return}
        val sb=StringBuilder("Résultat — ${SimpleDateFormat("dd/MM/yyyy",Locale.FRANCE).format(Date())}\n\n")
        var total=0.0
        workers.forEach{ w->
            val share=kg*w.percent.coerceAtLeast(0.0)/points
            val euros=share*p; total+=euros
            sb.append("${w.name}: ${"%.2f".format(Locale.FRANCE,share)} kg  →  ${"%.2f".format(Locale.FRANCE,euros)} €\n")
        }
        sb.append("\nTotal: ${"%.2f".format(Locale.FRANCE,kg)} kg → ${"%.2f".format(Locale.FRANCE,total)} €")
        result.text=sb.toString()
    }
    private fun shareResult(){
        if(result.text.isBlank()) calculate()
        startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply{
            type="text/plain";putExtra(Intent.EXTRA_TEXT,result.text.toString())
        },"Partager avec"))
    }
}
