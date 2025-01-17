<?php
/** @noinspection PhpUnused */
/** @noinspection SqlResolve */
/**
 * Search
 *
 * Search functions for SIL Dictionaries.
 *
 * PHP version 5.2
 *
 * LICENSE GPL v2
 *
 * @package WordPress
 * @since 3.1
 */

// This file was originally based upon the Search Custom Fields plugin and template
// (search-custom.php) by Kaf Oseo. http://guff.szub.net/search-custom-fields/.
// The code has since been mangled and evolved beyond recognition from that.

// don't load directly
if ( ! defined('ABSPATH') )
	die( '-1' );

//---------------------------------------------------------------------------//


function sil_dictionary_custom_message()
{
	$search_term = filter_input(INPUT_GET, 's', FILTER_UNSAFE_RAW, ['options' => ['default' => '']]);
	$match_whole_words = is_match_whole_words(mb_strlen($search_term));

	if($match_whole_words == 0)
	{
		return;
	}

	$partialsearch = filter_input(INPUT_GET, 'partialsearch', FILTER_VALIDATE_INT, ['options' => ['default' => 0]]);

	mb_internal_encoding("UTF-8");
	if($partialsearch != 1)
	{
		if(!is_CJK($search_term) && mb_strlen($search_term) > 0 && (mb_strlen($search_term) <= 3 || $match_whole_words == 1))
		{
			//echo getstring("partial-search-omitted");
			_e('Because of the brevity of your search term, partial search was omitted.', 'sil_dictionary');
			echo "<br>";
			$replacedQueryString = str_replace("match_whole_words=1", "match_whole_words=0", $_SERVER["QUERY_STRING"]);
			echo '<a href="?partialsearch=1&' . $replacedQueryString . '" style="text-decoration: underline;">'; _e('Click here to include searching through partial words.', 'sil_dictionary'); echo '</a>';
		}
	}
}


//---------------------------------------------------------------------------//

/**
 * Does the string have Chinese, Japanese, or Korean characters?
 * @param string $string = string to check
 * @return bool = whether the string has Chinese/Japanese/Korean characters.
 */
function is_CJK( $string ) {
	$regex = '/' . implode( '|', get_CJK_unicode_ranges() ) . '/u';
	return preg_match( $regex, $string );
}

function is_match_whole_words($search)
{
	global $wp_query;

	$match_whole_words = 0;
	if(isset($wp_query->query_vars['match_whole_words']))
	{
		if($wp_query->query_vars['match_whole_words'] == 1)
		{
			$match_whole_words = 1;
		}
	}

	if(filter_input(INPUT_GET, 'partialsearch', FILTER_VALIDATE_INT, ['options' => ['default' => 0]]) == 1)
	{
		$match_whole_words = 0;
	}

	if(strlen($search) == 0 && $_GET['tax'] > 1)
	{
		$match_whole_words = 0;
	}

	return $match_whole_words;
}

//---------------------------------------------------------------------------//

/**
 * A function that returns Chinese/Japanese/Korean (CJK) Unicode code points
 * Slightly adapted from an answer by "simon" found at:
 * @link http://stackoverflow.com/questions/5074161/what-is-the-most-efficient-way-to-whitelist-utf-8-characters-in-php
 * @return array
 */
function get_CJK_unicode_ranges() {
	return array(
		"[\x{2E80}-\x{2EFF}]",      # CJK Radicals Supplement
		"[\x{2F00}-\x{2FDF}]",      # Kangxi Radicals
		"[\x{2FF0}-\x{2FFF}]",      # Ideographic Description Characters
		"[\x{3000}-\x{303F}]",      # CJK Symbols and Punctuation
		"[\x{3040}-\x{309F}]",      # Hiragana
		"[\x{30A0}-\x{30FF}]",      # Katakana
		"[\x{3100}-\x{312F}]",      # Bopomofo
		"[\x{3130}-\x{318F}]",      # Hangul Compatibility Jamo
		"[\x{3190}-\x{319F}]",      # Kanbun
		"[\x{31A0}-\x{31BF}]",      # Bopomofo Extended
		"[\x{31F0}-\x{31FF}]",      # Katakana Phonetic Extensions
		"[\x{3200}-\x{32FF}]",      # Enclosed CJK Letters and Months
		"[\x{3300}-\x{33FF}]",      # CJK Compatibility
		"[\x{3400}-\x{4DBF}]",      # CJK Unified Ideographs Extension A
		"[\x{4DC0}-\x{4DFF}]",      # Yijing Hexagram Symbols
		"[\x{4E00}-\x{9FFF}]",      # CJK Unified Ideographs
		"[\x{A000}-\x{A48F}]",      # Yi Syllables
		"[\x{A490}-\x{A4CF}]",      # Yi Radicals
		"[\x{AC00}-\x{D7AF}]",      # Hangul Syllables
		"[\x{F900}-\x{FAFF}]",      # CJK Compatibility Ideographs
		"[\x{FE30}-\x{FE4F}]",      # CJK Compatibility Forms
		"[\x{1D300}-\x{1D35F}]",    # Tai Xuan Jing Symbols
		"[\x{20000}-\x{2A6DF}]",    # CJK Unified Ideographs Extension B
		"[\x{2F800}-\x{2FA1F}]"     # CJK Compatibility Ideographs Supplement
	);
}

//---------------------------------------------------------------------------//

// I'm not sure this is being used.

// NOTE: no longer used
//function no_standard_sort($k) {
//	global $wp_query;
//	if(!empty($wp_query->query_vars['s'])) {
//		$k->query_vars['orderby'] = 'none';
//		$k->query_vars['order'] = 'none';
//	}
//}

function get_indexed_entries($query, $language)
{
	global $wpdb;

	$sql = "SELECT post_id, language_code, relevance, search_strings " .
	" FROM " . SEARCHTABLE .
	" WHERE search_strings LIKE '%" . $query . "%' ";
	if(!empty($language))
	{
		$sql .= " AND language_code = '" . $language . "'";
	}
	$sql .= "ORDER BY relevance DESC";

	return $wpdb->get_results($sql);
}

function get_post_id_bycontent($query)
{
	global $wpdb;

	$sql = "SELECT ID " .
			" FROM " . $wpdb->posts .
			" WHERE post_content LIKE '%" . $query . "%'";

	return $wpdb->get_var($sql);
}

function my_404_override() {
	global $wp_query;

	if(is_404())
	{
		$postname = get_query_var('name');

		$postid = get_post_id_bycontent($postname);

		if(isset($postid))
		{
			status_header( 200 );
			$wp_query->is_404=false;

			query_posts('p=' . $postid);
		}
	}
}
add_filter('template_redirect', 'my_404_override');

function filter_the_content_in_the_main_loop($content) {

	$content = normalizer_normalize($content, Normalizer::NFC);
	return $content;
}
add_filter('the_content', 'filter_the_content_in_the_main_loop');

function get_subquery_where($query)
{
	mb_internal_encoding('UTF-8');

	$search = trim($query->query_vars['s'] ?? '');

	if(empty($search)) {
		return '';
	}

	//search string gets trimmed and normalized to NFC
	if (class_exists('Normalizer', false))
	{
		$normalization = Normalizer::FORM_C;
		if(get_option('normalization') == 'FORM_D')
			$normalization = Normalizer::FORM_D;

		$search = normalizer_normalize($search, $normalization);
	}

	$search = strtolower($search);

	if(!empty($_GET['key'])) {
		$key = $_GET['key'];
	}
	elseif(!empty($query->query_vars['langcode'])) {
		$key = $query->query_vars['langcode'];
	}
	else {
		$key = '';
	}

	$subqueries = [];

	if( strlen( trim( $key ) ) > 0)
		$subqueries[] = SEARCHTABLE . ".language_code = '$key' ";

	//using search form
	$match_accents = false;
	if(isset($query->query_vars['match_accents']))
	{
		$match_accents = true;
	}

	//by default d à, ä, etc. are handled as the same letters when searching
	$collateSearch = "";
	if(get_option('distinguish_diacritics') == 1 || $match_accents == true)
	{
		$collateSearch = "COLLATE " . MYSQL_CHARSET . "_BIN"; //"COLLATE 'UTF8_BIN'";
	}

	$expanded_search = $search;
	//this is for creating a regular expression that searches words with accents & composed characters by only using base characters
	if(preg_match('/([aeiou])/', $search) && $match_accents == false && get_option("searchSomposedCharacters") == 1)
	{
		//first we add brackets around all letters that aren't a vowel, e.g. yag becomes (y)a(g)
		$expanded_search = preg_replace('/(^[aeiou])/u', '($1)', $expanded_search);
		//see https://en.wiktionary.org/wiki/Appendix:Variations_of_%22a%22
		//the mysql regular expression can't find words with  accented characters if we don't include them
		$expanded_search = preg_replace('/([a])/u', '(à|ȁ|á|â|ấ|ầ|ẩ|ā|ä|ǟ|å|ǻ|ă|ặ|ȃ|ã|ą|ǎ|ȧ|ǡ|ḁ|ạ|ả|ẚ|a', $expanded_search);
		$expanded_search = preg_replace('/([e])/u', '(ē|é|ě|è|ȅ|ê|ę|ë|ė|ẹ|ẽ|ĕ|ȇ|ȩ|ḕ|ḗ|ḙ|ḛ|ḝ|ė|e', $expanded_search);
		$expanded_search = preg_replace('/([ε])/u', '(έ|ἐ|ἒ|ἑ|ἕ|ἓ|ὲ|ε', $expanded_search);
		$expanded_search = preg_replace('/([ɛ])/u', '(ɛ', $expanded_search);
		$expanded_search = preg_replace('/([ə])/u', '(ə́|ə', $expanded_search);
		$expanded_search = preg_replace('/([i])/u', '(ı|ī|í|ǐ|ĭ|ì|î|î|į|ï|ï|ɨ|i', $expanded_search);
		$expanded_search = preg_replace('/([o])/u', '(ō|ṓ|ó|ǒ|ò|ô|ö|õ|ő|ṓ|ø|ǫ|ȱ|ṏ|ȯ|ꝍ|o', $expanded_search);
		$expanded_search = preg_replace('/([ɔ])/u', '(ɔ', $expanded_search);
		$expanded_search = preg_replace('/([u])/u', '(ū|ú|ǔ|ù|ŭ|û|ü|ů|ų|ũ|ű|ȕ|ṳ|ṵ|ṷ|ṹ|ṻ|ʉ|u', $expanded_search);
		//for vowels we add [^a-z]* which will search for any character that comes after the normal character
		//one can't see it, but composed characters actually consist of two characters, for instance the a in ya̧g
		$expanded_search = preg_replace('/([aeiouɛεəɔ])/u', '$1)[^a-z^ ]*', $expanded_search);
	}

	$match_whole_words = is_match_whole_words($search);

	if (is_CJK( $search ) || $match_whole_words == 0)
	{
		if(get_option('searchSomposedCharacters') == 1)
			$subqueries[] = 'LOWER(search_strings) REGEXP \'' . Webonary_Utility::escapeSql($expanded_search) . '\' ' . $collateSearch;
		else
			$subqueries[] = 'LOWER(search_strings) LIKE \'%' . Webonary_Utility::escapeSqlLike($search) . '%\' ' . $collateSearch;
	}
	else
	{
		if(mb_strlen($search) > 1)
		{
			$expanded_search = Webonary_Utility::escapeSql($expanded_search);

			if (mb_strpos($search, '\'') === false)
				$subqueries[] = "search_strings REGEXP '[[:<:]]{$expanded_search}[[:digit:]]?[[:>:]]' $collateSearch";
			else
				$subqueries[] = "search_strings REGEXP '([[:blank:][:punct:]]|^){$expanded_search}[[:digit:]]?([[:punct:][:blank:]]|$)' $collateSearch";
		}
	}

	if (empty($subqueries))
		return '';

	return 'WHERE ' . implode(' AND ', $subqueries);
}

/**
 * Hook to override the default post query
 *
 * @param $input
 * @param WP_Query $query
 * @return string
 */
function replace_default_search_filter($input, $query=null)
{
	global $wpdb;

	if (empty($query))
		return $input;

	// hanatgit 20200303 I re-write the logic slightly for clarity.
	// But in doing so, I realized that COMBINED searches, e.g. searching for a word
	// within semantic domain or parts of speech (taxomony) would not work as is.
	// TODO: fix these in Webonary 1.5
	if (isset($_GET['tax']) && $_GET['tax'] > 1)
	{
		$input = "SELECT SQL_CALC_FOUND_ROWS DISTINCTROW $wpdb->posts.* " .
		" FROM $wpdb->posts " .
		" INNER JOIN $wpdb->term_relationships ON $wpdb->posts.ID = $wpdb->term_relationships.object_id " .
		" INNER JOIN $wpdb->term_taxonomy ON $wpdb->term_relationships.term_taxonomy_id = $wpdb->term_taxonomy.term_taxonomy_id " .
		" WHERE $wpdb->posts.post_type IN ('post') AND $wpdb->term_taxonomy.term_id = " . $_GET['tax'] .
		" ORDER BY menu_order ASC, post_title ASC";
	}
	elseif (isset($query->query_vars['semdomain']))
	{
		$input = "SELECT SQL_CALC_FOUND_ROWS DISTINCTROW $wpdb->posts.* " .
		" FROM $wpdb->posts " .
		" LEFT JOIN $wpdb->term_relationships ON $wpdb->posts.ID = $wpdb->term_relationships.object_id " .
		" INNER JOIN $wpdb->term_taxonomy ON $wpdb->term_relationships.term_taxonomy_id = $wpdb->term_taxonomy.term_taxonomy_id " .
		" INNER JOIN $wpdb->terms ON $wpdb->term_taxonomy.term_id = $wpdb->terms.term_id  " .
		" WHERE $wpdb->posts.post_type = 'post' " .
		" AND $wpdb->term_taxonomy.taxonomy = 'sil_semantic_domains' AND $wpdb->terms.slug REGEXP '^" . $query->query_vars['semnumber'] ."([-]|$)' " .
		" ORDER BY menu_order ASC, post_title";
	}
	elseif (is_search() && (isset($_GET['s']) || isset($query->query_vars['s'])))
	{
		$searchWord = filter_input(INPUT_GET, 's', FILTER_UNSAFE_RAW, ['options' => ['default' => $query->query_vars['s']]]);
		$search_tbl = SEARCHTABLE;
		$where = empty($searchWord) ? 'WHERE post_id < 0' : get_subquery_where($query);

		$input = <<<SQL
SELECT SQL_CALC_FOUND_ROWS DISTINCTROW p.*, s.relevance
FROM {$wpdb->posts} AS p
  INNER JOIN (
			  SELECT post_id, MAX(relevance) AS relevance
			  FROM {$search_tbl} 
			  {$where}
			  GROUP BY post_id
			 ) AS s ON p.ID = s.post_id
WHERE p.post_type = 'post' AND p.post_status = 'publish'
ORDER BY s.relevance DESC, p.post_title
SQL;
	}
	else {
		return $input;
	}

	Webonary_Utility::setPageNumber((int)($query->query_vars['paged'] ?? 0));

	return $input . PHP_EOL . getLimitSql();
}
