import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import { RichText } from 'prismic-dom';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';

interface Post {
	uid: string
	first_publication_date: string | null;
	data: {
		title: string;
		banner: {
			url: string;
		};
		author: string;
		content: {
			heading: string;
			body: {
				text: string;
			}[];
		}[];
	};
}

interface PostProps {
	post: Post;
}

export default function Post({ post }: PostProps) {

	const router = useRouter()

	const totalWords = post.data.content.reduce((total, contentItem) => {
		total += contentItem.heading.split(' ').length;

		const words = contentItem.body.map(item => item.text.split(' ').length)
		words.map(word => (total += word))
		return total
	}, 0)

	const readingTime = Math.ceil(totalWords / 200)

	const formatedDate = format(
		new Date(post.first_publication_date),
		'dd MMM yyyy',
		{
			locale: ptBR,
		}
	)

	if (router.isFallback) {
		return <h1>Carregando...</h1>
	}

	return (
		<>
			<Head>
				<title>{post.data.title} | Ignews</title>
			</Head>
			<div className={styles.imgContainer}>
				<img className={styles.img} src={post.data.banner.url} alt="imagem" />
			</div>

			<main className={commonStyles.container}>
				<article className={styles.post}>
					<h1>{post.data.title}</h1>
					<div className={styles.info}>
						<FiCalendar />
						<time>{formatedDate}</time>
					</div>
					<div className={styles.info}>
						<FiUser />
						<span>{post.data.author}</span>
					</div>
					<div className={styles.info}>
						<FiClock />
						<span>{`${readingTime} min`}</span>
					</div>
					{post.data.content.map(texts => (
						<div key={texts.heading}>
							<h2>{texts.heading}</h2>
							<div dangerouslySetInnerHTML={{ __html: RichText.asHtml(texts.body) }} />
						</div>

					))}
				</article>
			</main>
		</>


	)
}

export const getStaticPaths: GetStaticPaths = async () => {
	const prismic = getPrismicClient();

	const posts = await prismic.query([
		Prismic.Predicates.at('document.type', 'posts'),
	]);

	const paths = posts.results.map(post => {
		return {
			params: {
				slug: post.uid,
			},
		}
	})

	return {
		paths,
		fallback: true,
	}
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
	const { slug } = params
	const prismic = getPrismicClient();
	const response = await prismic.getByUID('posts', String(slug), {})

	const post = {
		uid: response.uid,
		first_publication_date: response.first_publication_date,
		data: {
			title: response.data.title,
			subtitle: response.data.subtitle,
			banner: {
				url: response.data.banner.url
			},
			author: response.data.author,
			content: response.data.content.map(content => {
				return {
					heading: content.heading,
					body: [...content.body]
				}
			})
		}

	}

	return {
		props: {
			post
		},
		revalidate: 60 * 60
	}
}

