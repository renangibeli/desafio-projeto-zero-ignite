import { useEffect, useState } from 'react';

import { GetStaticProps } from 'next';
import Head from 'next/head'
import Link from 'next/link'

import Prismic from '@prismicio/client'

import { getPrismicClient } from '../services/prismic';

import { FiCalendar, FiUser } from 'react-icons/fi'

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';


import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';

interface Post {
	uid?: string;
	first_publication_date: string | null;
	data: {
		title: string;
		subtitle: string;
		author: string;
	};
}

interface PostPagination {
	next_page: string;
	results: Post[];
}

interface HomeProps {
	postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {

	const [posts, setPosts] = useState([])
	const [nextPage, setNextPage] = useState('')

	useEffect(() => {
		setPosts(results)
		setNextPage(next_page)
	}, [])

	const { results, next_page } = postsPagination

	async function handlePagination() {
		const response = await fetch(nextPage)
		const data = await response.json()

		const { next_page, results } = await data

		results.map(result => {
			let post = {
				uid: result.uid,
				first_publication_date: result.first_publication_date,
				data: {
					title: result.data.title,
					subtitle: result.data.subtitle,
					author: result.data.author
				}
			}

			setPosts([...posts, post])
		})
		setNextPage(next_page)
	}

	return (
		<>
			<Head>
				<title>Home | spacetraveling</title>
			</Head>
			<main className={commonStyles.container}>
				<div className={styles.posts}>
					{posts.map(post => (
						<Link key={post.uid} href={`/post/${post.uid}`}>
							<a>
								<h1>{post.data.title}</h1>
								<h2>{post.data.subtitle}</h2>
								<div>
									<FiCalendar />
									<time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
									<FiUser />
									<span>{post.data.author}</span>
								</div>
							</a>
						</Link>
					))}
				</div>
				{nextPage !== null
					? <button
						onClick={handlePagination}
						className={styles.loadBtn}
					>Carregar mais posts</button>
					: ''
				}
			</main>
		</>

	)
}

export const getStaticProps: GetStaticProps = async () => {
	const prismic = getPrismicClient();
	const postsResponse = await prismic.query(
		Prismic.predicates.at('document.type', 'posts'),
		{
			fetch: ['post.title', 'post.subtitle', 'post.author', 'post.banner', 'post.content'],
			pageSize: 2
		}
	)

	const { next_page } = postsResponse

	const results = postsResponse.results.map(post => {
		return {
			uid: post.uid,
			first_publication_date: post.first_publication_date,
			data: {
				title: post.data.title,
				subtitle: post.data.subtitle,
				author: post.data.author
			}
		}
	})

	return {
		props: {
			postsPagination: {
				results,
				next_page
			}
		},
		revalidate: 60 * 60 //1 hour
	}

}
