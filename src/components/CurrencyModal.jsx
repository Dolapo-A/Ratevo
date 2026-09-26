/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import { currencyFlag } from "/src/currencyFlag";

function CurrencyModal({
	isOpen,
	onClose,
	onSelect,
	currencies,
	selectedCurrency,
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredCurrencies, setFilteredCurrencies] = useState([]);

	// Initialize filteredCurrencies when currencies prop changes
	useEffect(() => {
		if (currencies) {
			const currencyArray = Object.entries(currencies).map(([code, data]) => ({
				code,
				name: data.name,
				rate: data.rate,
			}));
			setFilteredCurrencies(currencyArray);
		}
	}, [currencies]);

	function handleSearch(e) {
		const term = e.target.value.toLowerCase();
		setSearchTerm(e.target.value);

		if (!currencies) return;

		const filtered = Object.entries(currencies)
			.map(([code, data]) => ({
				code,
				name: data.name,
				rate: data.rate,
			}))
			.filter(
				(currency) =>
					currency.code.toLowerCase().includes(term) ||
					currency.name.toLowerCase().includes(term)
			);

		setFilteredCurrencies(filtered);
	}

	const handleSelect = (currency) => {
		onSelect(currency);
		setSearchTerm("");
		setFilteredCurrencies(
			Object.entries(currencies).map(([code, data]) => ({
				code,
				name: data.name,
				rate: data.rate,
			}))
		);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-2xl w-[90%] max-w-md max-h-[70vh] flex flex-col overflow-hidden">
				<div className="sticky top-0 bg-white z-10 px-4 py-2 rounded-t-2xl">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">Select Currency</h2>
						<button
							onClick={onClose}
							className="text-gray-500 hover:text-gray-700 w-3"
						>
							✕
						</button>
					</div>
					<div className="mb-4">
						<input
							autoFocus
							type="text"
							placeholder="Search currencies..."
							className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchTerm}
							onChange={handleSearch}
						/>
					</div>
				</div>

				<div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
					<div className="px-4 pb-4">
						<div className="grid gap-2">
							{filteredCurrencies.map((currency) => (
								<button
									key={currency.code}
									onClick={() => handleSelect(currency.code)}
									className={`p-3 flex items-center gap-3 rounded-lg hover:bg-gray-50 ${
										selectedCurrency === currency.code ? "bg-gray-50" : ""
									}`}
								>
									<img
										src={`/flags/${currencyFlag[
											currency.code
										]?.toLowerCase()}.png`}
										alt={currency.code}
										className="w-7 h-5 object-cover border border-gray-300 shadow-sm rounded"
										onError={(e) => {
											e.target.src = "/flags/default-flag.png";
											e.target.onerror = null;
										}}
									/>
									<div className="flex flex-col items-start">
										<span className="font-medium">{currency.code}</span>
										<span className="text-sm text-gray-500">
											{currency.name || currency.code}
										</span>
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default CurrencyModal;
