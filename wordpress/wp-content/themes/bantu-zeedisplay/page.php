<?php get_header(); ?>

	<div id="content">
		
		<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		
			<div id="page-<?php the_ID(); ?>" <?php post_class(); ?>>
				
				<?php if (! is_front_page()) { ?>
					<h2><?php the_title(); ?></h2>
				<?php } ?>
					
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

	<?php get_sidebar(); ?>
<?php get_footer(); ?>	