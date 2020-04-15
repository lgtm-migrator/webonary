<?php
/*
Template Name: Page Fullwidth
*/
?>
<?php get_header(); ?>

	<div id="content" class="fullwidth">
		
		<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		
			<div id="page-<?php the_ID(); ?>" <?php post_class(); ?>>
				
				<!-- I took this out of here so that Page titles don't show on posts - Martin Diprose
				
				<h2><?php the_title(); ?></h2>-->

				<div class="entry">
					<?php the_post_thumbnail('medium', array('class' => 'alignleft')); ?>
					<?php the_content(); ?>
					<div class="clear"></div>
					<?php wp_link_pages(); ?>
				</div>
				
				
			</div>

		<?php endwhile; ?>

		<?php endif; ?>
		
	</div>

<?php get_footer(); ?>	