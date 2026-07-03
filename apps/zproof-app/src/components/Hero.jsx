import React from "react";
import dashboard from "../assets/dashboard.jpeg";

export default function Hero() {
	return (
		<section className="py-10 bg-gray-50 sm:py-16 lg:py-24">
			<div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
				<div className="max-w-xl mx-auto text-center">
					<p className="text-sm font-semibold tracking-widest text-blue-600 uppercase">
						Connecting millions of social media users to web3
					</p>

					<h2 className="mt-6 text-3xl font-bold leading-tight text-black sm:text-4xl lg:text-4xl">
						Decentralized Web3 connector for social networks{" "}
					</h2>
				</div>

				<div className="grid items-center grid-cols-1 mt-12 gap-y-10 lg:grid-cols-5 sm:mt-20 gap-x-4">
					<div className="space-y-8 lg:pr-16 xl:pr-24 lg:col-span-2 lg:space-y-8">
						<div className="flex items-start">
							<svg
								className="flex-shrink-0 text-green-500 w-9 h-9"
								viewBox="0 0 28 28"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M14 26.731H24C25.1 26.731 26 25.831 26 24.731V10.731C26 9.63097 25.1 8.73097 24 8.73097H4.2C3 8.73097 2 7.73097 2 6.53097C2 5.43097 2.8 4.53097 3.8 4.43097L17.2 2.03097C18.2 1.83097 19 2.63097 19 3.53097V5.73097"
									stroke="#0C4ADA"
									strokeWidth="2"
									strokeMiterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M2 6.73145V17.7314"
									stroke="#0C4ADA"
									strokeWidth="2"
									strokeMiterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M21 19.2314C21.8284 19.2314 22.5 18.5599 22.5 17.7314C22.5 16.903 21.8284 16.2314 21 16.2314C20.1716 16.2314 19.5 16.903 19.5 17.7314C19.5 18.5599 20.1716 19.2314 21 19.2314Z"
									fill="#0C4ADA"
								/>
								<path
									d="M7.5 15.7314C8.32843 15.7314 9 15.0599 9 14.2314C9 13.403 8.32843 12.7314 7.5 12.7314C6.67157 12.7314 6 13.403 6 14.2314C6 15.0599 6.67157 15.7314 7.5 15.7314Z"
									stroke="#20BFFC"
									strokeWidth="2"
									strokeMiterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M13.5 23.7314C14.3284 23.7314 15 23.0599 15 22.2314C15 21.403 14.3284 20.7314 13.5 20.7314C12.6716 20.7314 12 21.403 12 22.2314C12 23.0599 12.6716 23.7314 13.5 23.7314Z"
									stroke="#20BFFC"
									strokeWidth="2"
									strokeMiterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M7.5 15.7314V19.2314L2 22.7314V26.7314"
									stroke="#20BFFC"
									strokeWidth="2"
									strokeMiterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M12.3 23.1318L10 24.7318V26.7318"
									stroke="#20BFFC"
									strokeWidth="2"
									strokeMiterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M6 26.7314V24.7314"
									stroke="#20BFFC"
									strokeWidth="2"
									strokeMiterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>

							<div className="ml-5">
								<h3 className="text-xl font-semibold text-black">
									Smart wallet for Social Networks
								</h3>
								<p className="mt-2 text-base text-gray-600">
									Non-custodial smart wallet with seamless connection for social
									networks
								</p>
							</div>
						</div>

						<div className="flex items-start">
							<svg
								className="flex-shrink-0 text-green-600 w-9 h-9"
								viewBox="0 0 28 28"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M23.2165 3.11133H19.196C17.7157 3.11133 16.5156 4.31136 16.5156 5.79167V9.81218C16.5156 11.2925 17.7157 12.4925 19.196 12.4925H23.2165C24.6968 12.4925 25.8968 11.2925 25.8968 9.81218V5.79167C25.8968 4.31136 24.6968 3.11133 23.2165 3.11133Z"
									stroke="#3D7F5E"
									strokeWidth="2.68034"
									strokeMiterlimit="10"
									stroke-linecap="round"
								/>
								<path
									d="M9.81023 3.27832H5.78972C4.3094 3.27832 3.10938 4.47835 3.10938 5.95866V9.97918C3.10938 11.4595 4.3094 12.6595 5.78972 12.6595H9.81023C11.2905 12.6595 12.4906 11.4595 12.4906 9.97918V5.95866C12.4906 4.47835 11.2905 3.27832 9.81023 3.27832Z"
									stroke="#3D7F5E"
									strokeWidth="2.68034"
									strokeMiterlimit="10"
									stroke-linecap="round"
								/>
								<path
									d="M23.2165 16.5127H19.196C17.7157 16.5127 16.5156 17.7127 16.5156 19.193V23.2136C16.5156 24.6939 17.7157 25.8939 19.196 25.8939H23.2165C24.6968 25.8939 25.8968 24.6939 25.8968 23.2136V19.193C25.8968 17.7127 24.6968 16.5127 23.2165 16.5127Z"
									stroke="#3D7F5E"
									strokeWidth="2.68034"
									strokeMiterlimit="10"
									stroke-linecap="round"
								/>
								<path
									d="M9.81023 16.5127H5.78972C4.3094 16.5127 3.10938 17.7127 3.10938 19.193V23.2136C3.10938 24.6939 4.3094 25.8939 5.78972 25.8939H9.81023C11.2905 25.8939 12.4906 24.6939 12.4906 23.2136V19.193C12.4906 17.7127 11.2905 16.5127 9.81023 16.5127Z"
									stroke="#3D7F5E"
									strokeWidth="2.68034"
									strokeMiterlimit="10"
									stroke-linecap="round"
								/>
							</svg>

							<div className="ml-5">
								<h3 className="text-xl font-semibold text-black">
									Unified Platform for dApps
								</h3>
								<p className="mt-2 text-base text-gray-600">
									Perform manual or smart transactions seamlessly across
									hundreds of dApp
								</p>
							</div>
						</div>

						<div className="flex items-start">
							<svg
								className="flex-shrink-0 text-red-500 w-9 h-9"
								viewBox="0 0 28 28"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M14.0013 12.445C15.29 12.445 16.3346 11.4003 16.3346 10.1117C16.3346 8.82299 15.29 7.77832 14.0013 7.77832C12.7126 7.77832 11.668 8.82299 11.668 10.1117C11.668 11.4003 12.7126 12.445 14.0013 12.445Z"
									fill="currentColor"
								/>
								<path
									d="M22.0855 13.9121C22.7308 12.5487 23.0208 11.0443 22.9286 9.53876C22.8364 8.03323 22.365 6.57546 21.5582 5.30101C20.7515 4.02657 19.6355 2.97684 18.3141 2.24945C16.9927 1.52206 15.5089 1.14063 14.0005 1.14062C12.4922 1.14063 11.0083 1.52206 9.68694 2.24945C8.36557 2.97684 7.2496 4.02657 6.4428 5.30101C5.63601 6.57546 5.1646 8.03323 5.07241 9.53876C4.98023 11.0443 5.27025 12.5487 5.91552 13.9121L1.45186 19.0711C1.31382 19.2308 1.22173 19.425 1.18538 19.633C1.14904 19.841 1.16982 20.0549 1.24549 20.252C1.32117 20.4491 1.44892 20.622 1.61511 20.7522C1.7813 20.8824 1.97971 20.9651 2.18919 20.9914L6.47319 21.5281L7.00986 25.8121C7.03875 26.0427 7.13587 26.2594 7.28876 26.4345C7.44165 26.6095 7.64333 26.7349 7.86796 26.7946C8.09259 26.8542 8.32993 26.8455 8.54953 26.7693C8.76913 26.6932 8.961 26.5533 9.10052 26.3674L14.0005 19.8341L18.9005 26.3674C19.0401 26.5533 19.2319 26.6932 19.4515 26.7693C19.6711 26.8455 19.9085 26.8542 20.1331 26.7946C20.3577 26.7349 20.5594 26.6095 20.7123 26.4345C20.8652 26.2594 20.9623 26.0427 20.9912 25.8121L21.5279 21.5281L25.8119 20.9914C26.0213 20.9651 26.2197 20.8824 26.3859 20.7522C26.5521 20.622 26.6799 20.4491 26.7556 20.252C26.8312 20.0549 26.852 19.841 26.8157 19.633C26.7793 19.425 26.6872 19.2308 26.5492 19.0711L22.0855 13.9121ZM8.96636 22.6574L8.67702 20.3381C8.64499 20.0803 8.52787 19.8407 8.34423 19.657C8.16058 19.4734 7.92092 19.3563 7.66319 19.3242L4.64386 18.9474L7.23386 15.9502C7.24086 15.9596 7.25019 15.9654 7.25719 15.9736C7.85283 16.6573 8.54821 17.2473 9.31986 17.7236L9.34669 17.7387C10.1045 18.2027 10.9276 18.5504 11.7885 18.7701C11.813 18.7771 11.8364 18.7887 11.8609 18.7946L8.96636 22.6574ZM15.5324 16.5371C15.3725 16.5744 15.2115 16.6059 15.0482 16.6316C14.9595 16.6456 14.872 16.6619 14.781 16.6724C14.2628 16.7393 13.7382 16.7393 13.22 16.6724C13.129 16.6619 13.0415 16.6456 12.9529 16.6316C12.7895 16.6059 12.6285 16.5744 12.4687 16.5371C12.3625 16.5114 12.2575 16.4857 12.1537 16.4554C12.0137 16.4146 11.8772 16.3667 11.7407 16.3166C11.6042 16.2664 11.4665 16.2151 11.3335 16.1567C11.162 16.0809 10.9929 16.0004 10.8295 15.9106C10.7129 15.8499 10.6137 15.7811 10.5075 15.7146C10.4014 15.6481 10.2917 15.5781 10.1879 15.5034C10.084 15.4287 10 15.3669 9.90902 15.2946C9.77019 15.1779 9.63486 15.0682 9.50536 14.9446C9.45752 14.9002 9.40736 14.8594 9.36186 14.8139C9.17237 14.6256 8.99432 14.4261 8.82869 14.2166C8.81469 14.2002 8.80302 14.1816 8.78902 14.1641C8.62593 13.9528 8.47518 13.7323 8.33752 13.5037C7.73317 12.5007 7.40607 11.3551 7.38967 10.1842C7.37327 9.01331 7.66816 7.85905 8.24418 6.83948C8.8202 5.81992 9.65668 4.97164 10.6681 4.3814C11.6795 3.79115 12.8295 3.48013 14.0005 3.48013C15.1716 3.48013 16.3216 3.79115 17.333 4.3814C18.3444 4.97164 19.1808 5.81992 19.7569 6.83948C20.3329 7.85905 20.6278 9.01331 20.6114 10.1842C20.595 11.3551 20.2679 12.5007 19.6635 13.5037C19.5259 13.7323 19.3751 13.9528 19.212 14.1641C19.198 14.1816 19.1864 14.2002 19.1724 14.2166C19.0067 14.4261 18.8287 14.6256 18.6392 14.8139C18.5937 14.8594 18.5424 14.9014 18.4945 14.9457C18.365 15.0624 18.2309 15.1791 18.092 15.2957C18.001 15.3681 17.9077 15.4369 17.8132 15.5046C17.7187 15.5722 17.602 15.6481 17.4935 15.7157C17.385 15.7834 17.2824 15.8511 17.1715 15.9117C17.0082 16.0016 16.839 16.0821 16.6675 16.1579C16.5345 16.2162 16.398 16.2676 16.2604 16.3177C16.1227 16.3679 15.9874 16.4157 15.8474 16.4566C15.7435 16.4857 15.6339 16.5114 15.5324 16.5371ZM20.3379 19.3242C20.0801 19.3563 19.8405 19.4734 19.6568 19.657C19.4732 19.8407 19.3561 20.0803 19.324 20.3381L19.0347 22.6574L16.1367 18.7934C16.1612 18.7934 16.1845 18.7759 16.209 18.7689C17.07 18.5492 17.8931 18.2016 18.6509 17.7376L18.6777 17.7224C19.4493 17.2461 20.1447 16.6561 20.7404 15.9724C20.7474 15.9642 20.7567 15.9584 20.7637 15.9491L23.3572 18.9474L20.3379 19.3242Z"
									fill="currentColor"
								/>
							</svg>

							<div className="ml-5">
								<h3 className="text-xl font-semibold text-black">
									Loyalty Point, Rewards & Airdrops
								</h3>
								<p className="mt-2 text-base text-gray-600">
									Earn loyalty points, rewards, and airdrops for using the
									platform and actively engaging
								</p>
							</div>
						</div>

						<div className="flex flex-col items-center mt-8 lg:justify-start sm:justify-center sm:flex-row lg:mt-16 sm:space-x-5">
							<a
								href="https://app.socket.fi/"
								title=""
								className="
                        relative
                        inline-flex
                        items-center
                        justify-center
                        w-48
                        px-8
                        py-2
                        text-base
                        font-bold
                        text-white
                        transition-all
                        duration-200
                        bg-gray-900
                        border-2 border-transparent
                        sm:w-auto
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
                        font-pj
                        hover:bg-opacity-90
                        rounded-xl
                    "
								target="_blank"
							>
								Go to App
							</a>

							<a
								href="https://docs.socket.fi/"
								title=""
								className="
          
                        inline-flex
                        items-center
                        justify-center
                        w-48
                        px-8
                        py-2
                        mt-5
                        text-base
                        font-bold
                        text-gray-900
                        transition-all
                        duration-200
                       gap-1
                        sm:w-autojustify-center sm:mt-0
                        rounded-xl
                        font-pj
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
                        hover:bg-gray-900
                        focus:bg-gray-900
                        hover:text-white
                        focus:text-white
                        hover:border-gray-900
                        focus:border-gray-900
                    "
								target="_blank"
							>
								Documentation
								<div className="">
									<svg
										className="h-5 w-auto"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<g clip-path="url(#clip0_1077_9075)">
											<path
												d="M9.16699 14.8887L20.167 3.88867"
												stroke="black"
												stroke-linecap="round"
											/>
											<path
												d="M13.4492 3.53516H20.5203V10.6062"
												stroke="black"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
											<path
												d="M17.5 13.5V16.26C17.5 17.4179 17.5 17.9968 17.2675 18.4359C17.0799 18.7902 16.7902 19.0799 16.4359 19.2675C15.9968 19.5 15.4179 19.5 14.26 19.5H7.74C6.58213 19.5 6.0032 19.5 5.56414 19.2675C5.20983 19.0799 4.92007 18.7902 4.73247 18.4359C4.5 17.9968 4.5 17.4179 4.5 16.26V9.74C4.5 8.58213 4.5 8.0032 4.73247 7.56414C4.92007 7.20983 5.20982 6.92007 5.56414 6.73247C6.0032 6.5 6.58213 6.5 7.74 6.5H11"
												stroke="black"
												stroke-linecap="round"
											/>
										</g>
										<defs>
											<clipPath id="clip0_1077_9075">
												<rect width="24" height="24" fill="white" />
											</clipPath>
										</defs>
									</svg>
								</div>
							</a>
						</div>
					</div>

					<div className="lg:col-span-3">
						<img
							className="w-full rounded-lg shadow-xl"
							// src="https://cdn.rareblocks.xyz/collection/celebration/images/features/7/dashboard-screenshot.png"
							src={dashboard}
							alt=""
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
