
/*
 *  
 * 
 * Grammaire du 5 : objectifs 
 *  1- Implémentation du multi-requete 			... Ok
 *  2- Implémentation du Nommage       			... Ok
 *  3- Implémentation du Select some   			... Nope
 *  4- Implémentation du Soit (?)      			... Partiel	(... Urgent pour les eq)
 *	5- Implémentation du Parmi  				... Ok
 *	6- Implémentation de la Sauvegarde			... Partiel (en cour, prio)
 *  7- Implémentation du Chargement (lié au 6) 	... Lié à sauvegarde.
 *
 *
 *
 *
 *  5- Voir la list Todo 22-04-2014 :/
 *
 */
{
 // id_req est utilisé pour faire l'id de la requete (qui est une chaine de caractères)
  var id_req =0;
  
  var id_obj = 0;
  var old_id_obj = id_obj;
  
  // Je garde le numéro id_obj que je veux récupérer via la requête
  var act_requete = 0;

  // Pour les multiples conditions, permet de savoir combien on a fait
  // de sous conditions obsel.
  var cond_push = 0;
  
  // Presence ou non de select some ou pas....
  var select_some_on = 0;

  //pour les préfixes des attributs. Pour le moment, on utilise base 
  //comme préfixe de tout les attributs
  var trace_baseURI = "";

  //http://dsi-liris-silex.univ-lyon1.fr/m2ia/ktbs/ap-mm-base-default/trace-default/@obsels
  //Je pique votre base, Antoine, Maël :p J'en ai besoin pour mes test..
  //var trace_modelURI = "<http://dsi-liris-silex.univ-lyon1.fr/m2ia/ktbs/ap-mm-base-default/trace-model-default/>";
  var trace_modelURI = "<http://liris.cnrs.fr/silex/2011/simple-trace-model/>"

  // Fonction qui s'occupe de compresser toutes les requetes
  function concat_all_request( request_list, num)
  { 
     chaine = " ";
 
     if(request_list[num][3] == null)
     {
        return request_list[num][2];
     }
	 
     //return request_list[num][2];	
     
    
     // Si les dépendances ne sont pas nulles, il faut rechercher dans la liste des 
     // requêtes l'ensemble des éléments
	 chaine += concat_one_request( request_list, num );

	return chaine;
	   
  }

  /* On récupère num. On */
  function concat_one_request( request_list, num)
  {	
		new_chaine = "";
		to_find = null ;
		request_dependance = null;
		/*Si la liste de dépendance est vide. Il suffit de renvoyer la requête telle que le bloc la renvoie */
        if(request_list[num][3] == null ){ return request_list[num][2]; }

        /*Sinon on doit remplacer les références */
		/* Pour toute les dépendances de la liste */
		for( bk=0; bk<request_list[num][3].length; bk++)
		{
			elem = request_list[num][3][bk];
			//alert("LIGNE 80 : "+request_list[num][3].length);
			remplace_id = -1;
			/* On recherche la requête correspondante dans la liste request_list */
			if( elem[1] == 1)
			{
				// On recherche un nom
				var nom = elem[0];
				for( rk=0; rk<request_list.length; rk++)
				{
					if( request_list[ rk ][1] == nom )
					{
						remplace_id = rk;
					}
				}
			}
			else
			if( elem[1] == 0 )	
			{
				// On recherche un id
				var nom_id = "id_ref" + elem[0];
				for( rk=0; rk<request_list.length; rk++)
				{
					if( request_list[ rk ][0] == nom_id )
					{
						remplace_id = rk;
					}
				}
			}
			//alert("Ligne 105 : " +remplace_id);
			// Normalement, l'id est donc supérieur à 0 !
			if( remplace_id <0) 
			{ // On ne peux pas continuer, il y a une erreur dans les référenceemnts
				console.log(  "unknown reference" );
			    request_list[num][3] = null;
				return ( "\n Erreur dans les références : Impossible de trouver " + elem[0] + " dans les références\n" );
			}
			// Si c'est une auto référence, l'indiquer aussi
			if(remplace_id == num)
			{
				console.log(  "référence is same as itself" );
			    request_list[num][3] = null;
				return ( "\n Auto référencement détecté. On ne peut faire des conditions en fonction de soit même\n" );
			}
			
			// Si la sous requête a des dépendances, il faut faire les dépendances avant le déréférencement.
			if( request_list[remplace_id][3] != null && request_list[remplace_id][3].length  > 0 )
			{
			  //alert("LIGNE 124  : appel a dépendance"  );
			  concat_one_request( request_list, remplace_id );
			}
			// On peut maintenant remplacer l'élément avec la bonne référence et ajouter le corp de la requête.
			// !!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!
			// request_list[remplace_id] est la requête qu'i l faut introduire dans l'ensemble... pas la requête dans laquelle on remplace...
			
			// Cette partie est à séparer en 4 comportements selon ce qu'on récupère
			// Il y a le cas d'un obsel, id_ref+BASE+_s, id_ref+BASE+_p, id_ref+BASE+_o, et d'un attribut : id_ref+BASE+_att
			// On doit donc faire 4 recherches, que ce soit avec le nom ou avec le numero
			var replaced_string1 = "id_ref" + request_list[remplace_id][1];
			var replaced_string2 = request_list[ remplace_id ][0]; 
			
			// On doit récupérer le numéro à rajouter à la fin selon le contexte
			var num_old_request1 = null;
			var id = 0;
			num_old_request1 = request_list[remplace_id][2].search("sobs");
			num_old_request1 += 4;
			end_num_old_request = num_old_request1;
			while(  parseInt(request_list[remplace_id][2][end_num_old_request])
					|| parseInt( request_list[remplace_id][2][end_num_old_request]) < 0 )
			{
				id = 10*id + parseInt( request_list[remplace_id][2][end_num_old_request]);
				//alert("Coucou "+id);
				end_num_old_request++;
			}
			
			//alert("LIGNE 130 : "+id);
			/* Le cas de l'equation... on peut avoir des valeurs d'attribut ou des num, selon */
			var equation_remp ;
			// On remplace si on trouve COUNT... Mais cela ne marche pas sur la chaine entière
			// (cas ou l on a dejja remplace un count precedemment
			if( request_list[remplace_id][2].substr(0, 50).search("SELECT \\(COUNT") ==-1) 
				{ equation_remp = "?oobs";}
			else
				{ equation_remp = "?num_sobs";}
			
			// On commence avec les noms
			// On fait le remplacement pour l equation
			temp_rep = replaced_string1+'_eq';
			request_list[num][2] = request_list[num][2].replace( temp_rep, equation_remp+id);
			
			// On a tout trouvé, on fait tout les remplacements possibles
			temp_rep = replaced_string1+'_s';
			request_list[num][2] = request_list[num][2].replace( temp_rep, "?sobs"+id);
			temp_rep = replaced_string1+'_p';
			request_list[num][2] = request_list[num][2].replace( temp_rep, "?pobs"+id);
			temp_rep = replaced_string1+'_o';
			request_list[num][2] = request_list[num][2].replace( temp_rep, "?oobs"+id);
			temp_rep = 'num_'+replaced_string1;
			request_list[num][2] = request_list[num][2].replace( temp_rep, "?num_sobs"+id);
			
			// On recommence avec les numeros maintenant !
			// On fait le remplacement pour l equation
			temp_rep = replaced_string2+'_eq';
			request_list[num][2] = request_list[num][2].replace( temp_rep, equation_remp+id);
			
			// On a tout trouvé, on fait tout les remplacements possibles
			temp_rep = replaced_string2+'_s';
			request_list[num][2] = request_list[num][2].replace( temp_rep, "?sobs"+id);
			temp_rep = replaced_string2+'_p';
			request_list[num][2] = request_list[num][2].replace( temp_rep, "?pobs"+id);
			temp_rep = replaced_string2+'_o';
			request_list[num][2] = request_list[num][2].replace( temp_rep, "?oobs"+id);
			temp_rep = 'num_'+replaced_string2;
			request_list[num][2] = request_list[num][2].replace( temp_rep, "?num_sobs"+id);
			
			
			// On a fini les remplacement, on rajoute la requête à la fin
			request_list[num][2][ request_list[num].length -1];
			
			
			// Il faut ensuite mettre la nouvelle requête en sous requête dans le where (inclusion forcée)
			
			request_list[num][2] = [request_list[num][2].slice(0, request_list[num][2].length-1), "{"+request_list[remplace_id][2]+"}", request_list[num][2].slice(request_list[num][2].length-1)].join('');

			// On fait ensuite un substring selon le type de remplacement
			
			
		}
		// Si on est ici, on peut vider les dépendances. Il faut vider les dépendances.
		//request_list[num][3] = null;
		return request_list[num][2];
		
  }
  
}

/* ==================================== */
/* == Début : Création des requêtes  == */
/* ==================================== */

prefix = s:start { 

var resultats = "";

resultats += "SELECT * WHERE {";
for(i in s)
{
  if(i == 0) { resultats += "{"; } else { resultats += "union {";}
  resultats += concat_all_request( s, i) + "}";
}
resultats += "}";
//"}" parce qu'il y a un raccourci fait qui vérifie le nombre d'accolades ouvertes qui fait bug


return "prefix : <http://liris.cnrs.fr/silex/2009/ktbs#> \n prefix ns1: <http://liris.cnrs.fr/silex/2011/simple-trace-model/> \n prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n prefix xml: <http://www.w3.org/XML/1998/namespace> \n prefix xsd: <http://www.w3.org/2001/XMLSchema#> \n\n prefix base: <http://liris.cnrs.fr/silex/2011/simple-trace-model/> \n prefix model: "+ trace_modelURI +"\n\n" + resultats; 



return  "prefix : <http://liris.cnrs.fr/silex/2009/ktbs#> \n prefix ns1: <http://liris.cnrs.fr/silex/2011/simple-trace-model/> \n prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n prefix xml: <http://www.w3.org/XML/1998/namespace> \n prefix xsd: <http://www.w3.org/2001/XMLSchema#> \n\n prefix base: <http://liris.cnrs.fr/silex/2011/simple-trace-model/> \n prefix model: "+ trace_modelURI +"\n\n" + s.join(""); } 


// C'est ici qu'on doit faire les transformations des dépendances
start = res:requete espace* res2:start* 
{
 temp = new Array(res);
 for(i in res2[0]){ temp.push(res2[0][i])}
 return temp;

}
        / res:( requete ) requete { return res }


requete = debutA espace* ac:action espace* n:nomFin? espace* point { id_req++; 

//Ce qu'il faut retourner pour utiliser avec la fonction
return [ "id_ref"+id_req, n, ac[0], ac[1]];

}
        / n:debutB espace* ac:objet_condition espace* point { id_req++; 
// Conditions sur les obsels et les attributs
return [ "id_ref"+id_req, n, ac[0], ac[1]];
}
		/ n:debutB espace* ac:compter_short espace* point { id_req++; 
// Soit C le nombre de....
return [ "id_ref"+id_req, n, ac[0], ac[1]];
}

		/n:debutB espace* point { return "unsupported now";}
        / n:debutC espace* ac:objet_condition  espace* point { id_req++; 
//Ce qu'il faut retourner pour utiliser avec la fonction
return [ "id_ref"+id_req, n, ac[0], ac[1]];
}		
/ n:debutC espace* ac:compter_short espace* point { id_req++; 
// Je nomme C le nombre de....
return [ "id_ref"+id_req, n, ac[0], ac[1]];
}
       / n:debutD espace* debutA espace* ac:action espace* n2:nomFin? espace* point { id_req++; 
/* Je fais une référence particulière */
// On introduit la reference dans le block
var ajout = "?sobs"+ old_id_obj +" ?pobs"+old_id_obj +" ?oobs"+old_id_obj ;
ajout += ".\n id_ref"+n+"_s" +" ?pobs"+old_id_obj +" ?oobs"+old_id_obj +". \n";

var out = [ac[0].slice(0, ac[0].length-1), ajout, ac[0].slice(ac[0].length-1)].join('');

//Si les dépendances sont nulles, on en rajoute
if(ac[1] == null) { ac[1] = new Array(); }

// Si le parseInt est un nombre, dependance de type nombre. Sinon de type nom
if( isNaN(parseInt( n, 10)) )
// On rajoute la dependance de type nom
{ ac[1].push( [ n , 1] ); }
else
// On rajoute la dependance de type nombre
{ ac[1].push( [ n , 0] ); }
//alert("LIGNE 247 :" + ac[1] );
//alert("LIGNE 248 :" + n2 );

//alert("LIGNE 212 : Dépendance stack :" + ac[1][0][1]);
//Ce qu'il faut retourner pour utiliser avec la fonction
return [ "id_ref"+id_req, n2, out, ac[1]];
}


/* ================================= */
/* ==         Creation de nom     == */
/* ================================= */
nomFin = espace* 'que'i espace* 'je'i espace* 'nomme'i espace* n:idvalue { return n.join(""); }
  

/* ================================= */
/* ==  Choix du départ de phrase  == */
/* ================================= */
debutA = ('je'i espace 'cherche'i espace 'à'i / 'je'i espace 'veux'  )
              { return "";}

debutAb = ('je'i espace 'cherche'i espace / 'je'i espace 'veux'  )
              { return "";}
			  
debutB = ('Soit'i ) espace* n:idvalue {return n.join("");} 

debutC =  ( 'Je'i espace* 'nomme'i ) espace* n:idvalue { return n.join("");}

debutD = ( 'Parmi'i ) espace* n:id_name_ref espace* virgule espace* { return n.join(""); }


/* C'est cet element qui permet d'écrire ailleurs */
id_name_ref = ( ref:idvalue) {return ref};

/* =================================================== */
/* == Type de requête debutB : select/ask/construct == */
/* =================================================== */
// Soit : les obsel + condition, soit le nombre de, (soit les attributs ? )


/* =================================================== */
/* == Type de requête debutA : select/ask/construct == */
/* =================================================== */
action = res:recuperer { return res;} 
       / res:compter { return res; }
	   
action_short = res:compter_short { return res; }
			  /res:recuperer_short {return res;}
			  
/* liste de fonctions */
recuperer_short =  espace + obj:objet_condition { return obj; }

recuperer = 'récupérer'i espace + obj:objet_condition { return obj; }

compter_short = espace* 'le'i espace* 'nombre'i espace* obj:obsel_condition { id_obj++; return ["SELECT (COUNT ( distinct ?sobs"+ old_id_obj +" ) AS ?num_sobs"+ old_id_obj + ") \nWHERE \n "+ obj[0], obj[1] ];}

compter = 'compter'i espace* 'le'i espace* 'nombre'i espace* obj:obsel_condition { id_obj++; return ["SELECT (COUNT ( distinct ?sobs"+ old_id_obj +" ) AS ?num_sobs"+ old_id_obj + ") \nWHERE \n "+ obj[0], obj[1] ];}

/* ============================ */
/* ==  Objets avec condition == */
/* ============================ */
objet_condition =  res:obsel_condition { id_obj++; return [ "SELECT DISTINCT ?sobs"+ old_id_obj +" ?pobs"+old_id_obj +" ?oobs"+old_id_obj +" \nWHERE \n "+ res[0] , res[1] ];} 
                / res:attribut_condition {id_obj++; return [ "SELECT DISTINCT ?oobs"+old_id_obj +" \nWHERE \n "+ res, null];}
                / res:valeur_condition { return res; } 


/* ===============================*/
/* = -1 Obsel condition détaillé =*/
/* ===============================*/
obsel_condition = res:conditionOnObsel { return res;} 
                /res:all_obsel { return res;} 
                / res:one_obsel { return res;}


/* == Tout les obsels - pas de condition */ 
all_obsel =  ('tout'i)? espace* 'les'i? espace* 'obsels'i { return ["{ \n ?sobs"+ id_obj +" ?pobs"+id_obj +" ?oobs"+id_obj +" .\n ?sobs"+ id_obj +" :hasEnd ?dateEndobs"+ id_obj +" .\n ?sobs"+ id_obj +" :hasBegin ?dateBeginobs"+ id_obj +" .\n }", null, null]; }

/* == Un obsel. Une condition */
one_obsel = 'l\''i espace* 'obsel' espace* { return "\none_obsel cond reached"}

/* == Conditions multiples sur obsel. Cas plus général */
conditionOnObsel = ('l\''i / 'les'i/ 'd\''i /'d'i)? espace* 'obsel'[sS]? espace* cond:condListObsel {  return cond; }
                 / ('l\''i / 'les'i/ 'd\''i /'d'i)? espace* 'obsel'[sS]? espace* { 

old_id_obj = id_obj;
id_obj+= act_requete+1;
act_requete = 0;

 return [ "{ \n ?sobs"+ old_id_obj +" ?pobs"+old_id_obj +" ?oobs"+old_id_obj +" .\n ?sobs"+ old_id_obj +" :hasEnd ?dateEndobs"+ old_id_obj +" .\n ?sobs"+ old_id_obj +" :hasBegin ?dateBeginobs"+ old_id_obj +" .\n }", null ];}

/*   Récupérer une variable unique pour désigner un obsel (op temporel) 
   ------------------------------------------------------ */
obsel = ("un"/"l\'"/"l"/"d"/"d\'") espace* "obsel"i { act_requete++; return "?sobs"+(id_obj+act_requete); }
obsels = ("les"i/"l\'"/"l") espace* "obsel"i[sS]? { act_requete++; return "?sobs"+act_requete; }

/* type de condition */
condListObsel =  c2:( condSimpleObsel )* espace* c3:(condTempObsel)* {

var condition = "";
condition = "";
var dependances = [];

/*if(c1[0] != null) { condition += " "+c1[0].join("")+ " \n"; } else { condition +=" "; }
if( c1[1] != null) { dependances.push( c1[1] ); }
*/
for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}
for( u in c3)
{
  if(c3[u][0] != null){ condition += c3[u][0] + "\n";} 
  if(c3[u][1] != null){ dependances.push(c3[u][1]); }
}

old_id_obj = id_obj;
id_obj+= act_requete+1;
act_requete = 0;

if(dependances.length == 0) { dependances = null;}

return [ "{ \n ?sobs"+ old_id_obj +" ?pobs"+old_id_obj +" ?oobs"+old_id_obj +" .\n ?sobs"+ old_id_obj +" :hasEnd ?dateEndobs"+ old_id_obj +" .\n ?sobs"+ old_id_obj +" :hasBegin ?dateBeginobs"+ old_id_obj +" .\n" + condition +
"\n }" , dependances];}

/* Une seule condition temporelle */
LimitedCondListObsel = c1:condSimpleObsel espace* c2:( condSimpleObsel )* espace* c3:(LimitedCondTempObsel)? {

var condition = " "+c1[0]+ " \n";
var dependances = [];

if( c1[1] != null) { dependances.push( c1[1] ); }

for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}
for( u in c3)
{
  if(c3[u][0] != null){ condition += c3[u][0] + "\n";} 
  if(c3[u][1] != null){ dependances.push(c3[u][1]); }
}

if(dependances.length == 0) { dependances = null;}

return [ "SELECT ?sobs"+ id_obj +" ?pobs"+id_obj +" ?oobs"+id_obj +" \nWHERE \n { \n ?sobs"+ id_obj +" ?pobs"+id_obj +" ?oobs"+id_obj +" .\n ?sobs"+ id_obj +" :hasEnd ?dateEndobs"+ id_obj +" .\n ?sobs"+ id_obj +" :hasBegin ?dateBeginobs"+ id_obj +" .\n" + condition +
"\n }", dependances ];}


/* Les conds simples obsels n'engendrent pas de dépendances. */
condSimpleObsel = c1:condTypeObsel { return [ "?sobs"+(id_obj+act_requete) + c1 +" ." , null]; }
                / c1:condUnamedValueNonAttribute { return [ c1+" ", null ]; }
                / c1:condUnamedValueAttribute { return [c1+" .", null ]; }
                / c1:condPossessAttributeNonEqual {  return [ c1+" ", null ];}
                / c1:condPossessAttributeEqual {  return [ c1+" .", null ];}
                / c1:condNonPossessAttribute {  return [ c1+" .", null ];}
                / c1:condPossessAttribute { return [ c1+" .", null]; }
                / espace* virgule espace* c1:condSimpleObsel { return c1; }
                / espace* 'et' espace*  c1:condSimpleObsel  {  return c1; }
          

/* ==================================*/
/* = -1 ObselTypecondition détaillé =*/
/* ==================================*/
condTypeObsel = 'de'i? espace*'type'i espace* id:idvalue espace* { return " rdf:type model:"+id.join(""); }

/* ========*/
condNonPossessAttribute =  'n' espace* "'" espace* 'ayant'i? espace* 'pas' espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* { 
cond_push++;
return "FILTER NOT EXISTS { "+
" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("") + " . \n } " ; 
}

/* ========*/
condPossessAttribute = 'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* { 
cond_push++;
return "?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join(""); 
}

/* ========*/
condPossessAttributeEqual = 
						/* Variante superieur ou egale */
						'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* 'supérieure'i espace* 'ou'i espace* 'égale'i espace* ('à'/'a'i) espace* val:attribute_value  { 
						cond_push++;
						return "FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " >= "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("") ; 
						}
						/* Variante superieur */
						/'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* 'supérieure'i espace* ('à'/'a'i) espace* val:attribute_value  { 
						cond_push++;
						return "FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " > "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("") ; 
						}
						/* Variante inferieur ou egale */
						/'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* 'inférieure'i espace* 'ou'i espace* 'égale'i espace* ('à'/'a'i) espace* val:attribute_value  { 
						cond_push++;
						return "FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " <= "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("") ; 
						}
						/* Variante inferieur */
						/'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* 'inférieure'i espace* ('à'/'a'i) espace* val:attribute_value  { 
						cond_push++;
						return "FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " < "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("") ; 
						}
						/* Variant egale */
						/'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* val:attribute_value  { 
						cond_push++;
						return "FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " = "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("") ; 
						}

/* ========*/
condPossessAttributeNonEqual = 
						/* Variante superieur ou egale */
						'n' espace* "'" espace* 'ayant'i? espace* 'pas' espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* 'supérieure'i espace* 'ou'i espace* 'égale'i espace* ('à'/'a'i) espace* val:attribute_value  { 
						cond_push++;
						return "FILTER NOT EXISTS { FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " >= "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("") + " . \n }" ; 
						}
						/* Variante superieur */
						/'n' espace* "'" espace* 'ayant'i? espace* 'pas' espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* 'supérieure'i espace* ('à'/'a'i) espace* val:attribute_value  { 
						cond_push++;
						return "FILTER NOT EXISTS { FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " > "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("")  + " . \n }" ; 
						}
						/* Variante inferieur ou egale */
						/'n' espace* "'" espace* 'ayant'i? espace* 'pas' espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* 'inférieure'i espace* 'ou'i espace* 'égale'i espace* ('à'/'a'i) espace* val:attribute_value  { 
						cond_push++;
						return "FILTER NOT EXISTS { FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " <= "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("")  + " . \n }" ; 
						}
						/* Variante inferieur */
						/'n' espace* "'" espace* 'ayant'i? espace* 'pas' espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* 'inférieure'i espace* ('à'/'a'i) espace* val:attribute_value  { 
						cond_push++;
						return "FILTER NOT EXISTS { FILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " < "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("")  + " . \n }" ; 
						}
						/* Variant egale */
						/'n' espace* "'" espace* 'ayant'i? espace* 'pas' espace* ('un'/'l\'') espace* 'attribut'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* val:attribute_value  { 
						cond_push++;
						return "FILTER NOT EXISTS { \nFILTER( ?oobs"+(id_obj+act_requete)+id.join("") + " = "+ val +" ) \n" +
						" ?sobs" + (id_obj+act_requete) +" model:"+id.join("") +" ?oobs"+(id_obj+act_requete)+id.join("") + " . \n } " ; 
						}


/* ========*/
condUnamedValueAttribute =  /* Variant superieur ou egale */
							'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* 'supérieure'i espace* 'ou'i espace* 'égale'i espace* ('à'/'a'i) espace* val:attribute_value  { 
							cond_push++;
							return "FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " >= "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push; 
							} 
							/* Variant superieur*/
							/'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* 'supérieure'i espace* ('à'/'a'i) espace* val:attribute_value  { 
							cond_push++;
							return "FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " > "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push; 
							} 
							/* Variant inferieur ou egale */
							/'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* 'inférieure'i espace* 'ou'i espace* 'égale'i espace* ('à'/'a'i) espace* val:attribute_value  { 
							cond_push++;
							return "FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " <= "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push; 
							} 
							/* Variant inferieur */
							/'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* 'inférieure'i espace* ('à'/'a'i) espace* val:attribute_value  { 
							cond_push++;
							return "FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " < "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push; 
							} 
							/* Variant egale */
							/'ayant'i? espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* val:attribute_value  { 
							cond_push++;
							return "FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " = "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push; 
							} 


/* ========*/
condUnamedValueNonAttribute = /* Variant superieur ou egale */
							'n' espace* "'"? espace* 'ayant'i? espace* 'pas'i espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* 'supérieure'i espace* 'ou'i espace* 'égale'i espace* ('à'/'a'i) espace* val:attribute_value  { 
							cond_push++;
							return "FILTER NOT EXISTS { FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " >= "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push + " . \n }"; 
							} 
							/* Variant superieur*/
							/'n' espace* "'"? espace* 'ayant'i? espace* 'pas'i espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* 'supérieure'i espace* ('à'/'a'i) espace* val:attribute_value  { 
							cond_push++;
							return "FILTER NOT EXISTS { FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " > "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push + " . \n }"; 
							} 
							/* Variant inferieur ou egale */
							/'n' espace* "'"? espace* 'ayant'i? espace* 'pas'i espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* 'inférieure'i espace* 'ou'i espace* 'égale'i espace* ('à'/'a'i) espace* val:attribute_value  { 
							cond_push++;
							return "FILTER NOT EXISTS { FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " <= "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push + " . \n }"; 
							} 
							/* Variant inferieur */
							/'n' espace* "'"? espace* 'ayant'i? espace* 'pas'i espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* 'inférieure'i espace* ('à'/'a'i) espace* val:attribute_value  { 
							cond_push++;
							return "FILTER NOT EXISTS { FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " < "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push + " . \n }"; 
							} 
							/* Variant egale */
							/'n' espace* "'"? espace* 'ayant'i? espace* 'pas'i espace* ('un'/'l\'') espace* 'attribut'i espace* 'de'i espace* 'valeur'i espace* val:attribute_value  { 
							cond_push++;
							return "FILTER NOT EXISTS { \n FILTER( ?oobs"+(id_obj+act_requete) + "_" + cond_push + " = "+ val +" ) \n" +
							" ?sobs" + (id_obj+act_requete) + " ?pobs"+(id_obj+act_requete) + "_"+ cond_push +" ?oobs"+(id_obj+act_requete)+ "_"+ cond_push + " . \n }"; 
							} 


/* ========*/
attribute_value = id:IRIref { return id; }
                / id:([0-9]+) { return id.join(""); }
                / '"' id:[^"\r\n]+ '"' {return  '"' +id.join("") + '"' ; }
                / "'" id:[^'\r\n]+ "'" {return  "'" +id.join("") + "'" ; }
                / id:([^\r\n.,0-9]+) {return "'"+id.join("").replace(/^\s+/g,'').replace(/\s+$/g,'')+"'"; }

/* ==================================*/
/* = -0 Operateurs temporels Obsel  =*/
/* ==================================*/
condTempObsel =  espace* virgule? espace* 'et'i? espace* 'suivi'i[sS]? espace* 'par'i espace* ob:obsel espace* c2:condSimpleObsel* 
                { 
condition ="";
var dependances = [];
for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}

return [" after("+ob+","+"?sobs"+id_obj+") \n" +condition , null]; }

               / espace* virgule? espace* 'et'i? espace* 'précédé'i espace* 'par'i espace* ob:obsel espace* c2:condSimpleObsel* 
                { 
condition ="";
var dependances = [];
for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}

return [ " before("+ob+","+"?sobs"+id_obj+") \n" +  condition, null ];}

               / espace* virgule? espace* 'et'i? espace* 'strictement'i espace* 'suivi'i espace* 'par'i espace* ob:obsel espace* c2:condSimpleObsel* 
                { 
condition ="";
var dependances = [];
for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}

return [ " predecessor("+ob+","+"?sobs"+id_obj+") \n" + condition, null]; }

               / espace* virgule? espace* 'et'i? espace* 'suivi'i espace* 'strictement'i espace*  'par'i espace* ob:obsel espace* c2:condSimpleObsel* 
                { 
condition ="";
var dependances = [];
for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}

return [ " predecessor("+ob+","+"?sobs"+id_obj+") \n" + condition, null ]; }

               / espace* virgule? espace* 'et'i? espace* 'strictement'i espace* 'précédé'i espace* 'par'i espace* ob:obsel espace* c2:condSimpleObsel* 
                {
condition ="";
var dependances = [];
for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}

 return [ " successor("+ob+","+"?sobs"+id_obj+") \n" + condition, null]; }

               / espace* virgule? espace* 'et'i? espace* 'précédé'i espace* 'strictement'i espace*  'par'i espace* ob:obsel espace* c2:condSimpleObsel* 
                { 
condition ="";
var dependances = [];
for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}

return [" successor("+ob+","+"?sobs"+id_obj+") \n" + condition, null ];}

               / espace* virgule? espace* 'et'i? espace* 'pendant'i espace* ob:obsel espace* c2:condSimpleObsel* 
                { 
condition ="";
var dependances = [];
for( w in c2)
{
  if(c2[w][0] != null){ condition += c2[w][0] + "\n";} 
  if(c2[w][1] != null){ dependances.push(c2[w][1]); }
}

return [" during("+ob+","+"?sobs"+id_obj+") \n" + condition, null ];}

               /id:[element] { return id; }


/* Pour les obsels décrit à l'intérieur d'autres */
LimitedCondTempObsel = 'lui'i espace* 'même' espace* c1:condTempObsel {return c1;}

/* ==================================*/
/* = -1 attribut condition détaillé =*/
/* ==================================*/
attribut_condition = espace* 'les'i espace* 'attributs' espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* val:attribute_value  { return " { ?sobs"+ id_obj + " model:"+id.join("")+ " " + val + " . }";}
                   / espace* 'les'i espace* 'attributs' espace* id:idvalue { return "{ ?sobs"+ id_obj +" model:"+id.join("") + " ?oobs" + id_obj +" }"; } 
                   / espace* 'les'i espace* id:idvalue espace* 'de'i espace* 'valeur'i espace* val:attribute_value  { return " { ?sobs"+ id_obj + " model:"+id.join("")+ " " + val + " . }";}
                   / espace* 'les'i espace* id:idvalue espace* { return " { ?sobs"+ id_obj + " model:"+id.join("")+" ?oobs"+ id_obj+" . }";}
                    
				   

/*====== 
?sobs"+ id_obj +" ?pobs"+id_obj +" ?oobs"+id_obj


*/


/* ===============================*/
/* = -1 valeur condition détaillé =*/
/* ===============================*/
valeur_condition = ob:obsel


/* ============================ */
/* ==        Autres          == */
/* ============================ */
/* Séparateurs */
point = [.] {return "";}
virgule = [,] {return " ";}
et = 'et'i { return " "; }

espace = [ \n\r\t]+

stringvalue = id:[^'\\\r\n]+ { return id; }

idvalue = id:[^ .,\\\r\n\t]+ { return id; }
          / id:sparqlvaleur { return id;}

/* Throw all */
word = w:[^ \n\t]+ { return ":" + w.join("");}


/* ============================= */
/* ==       Soit équation     == */
/* ============================= */


/* ============================= */
/* ==  Le Centre de l'Oubli   == */
/* ============================= */
/* Récupération depuis SPARQL DOCUMENTATION annexe A (grammaire)*/
// C'est une copie de http://www.w3.org/TR/rdf-sparql-query/#rGraphTerm
// A savoir qu'on devrait pouvoir mettre des variables aussi...
// (Dans le cas où on l'a déjà référencé dans une phrase précédente, 
// par exemple
// Pour la chaine de caractère :
// - Il manque litteral_Long1 et 2...
// - Il manque la possibilité de spécifier le type (^^+URI)
// - Il manque le Langue TAG
sparqlvaleur = IRIref / RDFLiteral / NumericLiteral
             / BooleanLiteral / BlankNode / NIL

IRIref =  ('<' id:(([^<>"{}|^`\\])*) '>' ) { return '<' +id.join("")+ '>'; }
RDFLiteral = 
NumericLiteral =
BooleanLiteral =
BlankNode =
NIL = [ ] { return ref}
	