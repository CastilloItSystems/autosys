'use client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { classNames } from 'primereact/utils';
import { Chart } from 'primereact/chart';
import { Button } from 'primereact/button';
import { ProductService } from '../../../demo/service/ProductService';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import { Demo } from '../../../types/demo';
import { Avatar } from 'primereact/avatar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Badge } from 'primereact/badge';
import { InputText } from 'primereact/inputtext';
import { Knob } from 'primereact/knob';

export interface Product {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    inventoryStatus?: any;
    category?: string;
    image?: string;
    rating?: number;
}
// image: '/demo/images/dashboard/headphones.svg',
//         text: 'HF Headphones',
//         subtext: 'Wireless',
//         ratio: '+24%'
export interface listItem {
    image?: string;
    text?: string;
    subtext?: string;
    ratio?: string;
}

let revenueChart: ChartData<'pie'>;
let revenueOptions: ChartOptions<'pie'>;

const DashboardSales = () => {
    const [products, setProducts] = useState<Demo.Product[]>([]);
    const [productsThisWeek, setProductsThisWeek] = useState<Product[] | null>(null);
    const [productsLastWeek, setProductsLastWeek] = useState<Product[] | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [activeListItemIndex, setActiveListItemIndex] = useState<number>(1);
    const [selectedDrop, setSelectedDrop] = useState<any>(0);
    const [dates, setDates] = useState<any[]>();
    const [chatMessages, setChatMessages] = useState([
        { self: false, from: 'Jane Cooper', url: '/demo/images/avatar/stephenshaw.png', messages: ['Hey M. hope you are well. Our idea is accepted by the board. '] },
        { self: true, from: 'Jerome Bell', url: '/demo/images/avatar/ivanmagalhaes.png', messages: ['we did it! 🤠'] },
        { self: false, from: 'Darlene Robertson', url: '/demo/images/avatar/amyelsner.png', messages: ['I will be looking at the process then, just to be sure 🤓 '] }
    ]);
    const [listItems, setListItems] = useState<any>([
        { image: '/demo/images/dashboard/sneaker.png', text: 'Red Sneakers', subtext: 'RX Series', ratio: '+40%' },
        { image: '/demo/images/dashboard/headphones.png', text: 'HF Headphones', subtext: 'Wireless', ratio: '+24%' },
        { image: '/demo/images/dashboard/sunglasses.png', text: 'Sunglasses', subtext: 'UV Protection', ratio: '+17%' }
    ]);
    const [activeListItem, setActiveListItem] = useState<listItem | any>({
        image: '/demo/images/dashboard/headphones.svg',
        text: 'HF Headphones',
        subtext: 'Wireless',
        ratio: '+24%'
    });

    const chatcontainer = useRef<HTMLUListElement | null>(null);

    const value1 = 75;
    const value2 = 29;
    const value3 = 42;
    const value4 = 26;
    const value5 = 10;
    const value6 = 60;
    const orderWeek = [
        { name: 'This Week', code: '0' },
        { name: 'Last Week', code: '1' }
    ];
    const [selectedOrderWeek, setSelectedOrderWeek] = useState<any>(orderWeek[0]);
    const analytics = [
        { label: 'Products', value: 1 },
        { label: 'Sales', value: 2 },
        { label: 'Customers', value: 3 }
    ];

    const getRevenueChartData = () => {
        return {
            labels: ['Online', 'Retail', 'Partner'],
            datasets: [
                {
                    data: [12, 32, 56],
                    backgroundColor: [
                        getComputedStyle(document.documentElement).getPropertyValue('--indigo-500'),
                        getComputedStyle(document.documentElement).getPropertyValue('--teal-500'),
                        getComputedStyle(document.documentElement).getPropertyValue('--purple-500')
                    ],
                    borderWidth: 0
                }
            ]
        };
    };

    useEffect(() => {
        ProductService.getProductsSmall().then((data) => setProducts(data.slice(0, 5) as Demo.Product[]));
        ProductService.getProductsSmall().then((data) => setProductsThisWeek(data.slice(0, 5) as Product[]));
        ProductService.getProductsMixed().then((data) => setProductsLastWeek(data.slice(0, 5) as Product[]));
    }, []);

    useEffect(() => {
        revenueChart = getRevenueChartData();
        revenueOptions = {
            plugins: {
                legend: {
                    display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            cutout: 60
        };
    }, []);
    const recentSales = (code: string) => {
        if (code === '0') {
            setProducts(productsThisWeek as any);
        } else {
            setProducts(productsLastWeek as any);
        }
    };
    const onChatKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            let message = event.currentTarget.value;
            let newChatMessages = [...chatMessages];
            let lastMessage = newChatMessages[newChatMessages.length - 1];

            if (lastMessage.from) {
                newChatMessages.push({
                    self: true,
                    from: 'Jerome Bell',
                    url: '/demo/images/avatar/ivanmagalhaes.png',
                    messages: [message]
                });
                setChatMessages(newChatMessages);
            } else {
                lastMessage.messages.push(message);
                setChatMessages(newChatMessages);
            }

            if (message.match(/primeng|primereact|primefaces|primevue/i)) {
                newChatMessages.push({
                    self: true,
                    from: 'Ioni Bowcher',
                    url: '/demo/images/avatar/ionibowcher.png',
                    messages: ['Always bet on Prime!']
                });
                setChatMessages(newChatMessages);
            }

            event.currentTarget.value = '';

            const el = chatcontainer.current;
            setTimeout(() => {
                el?.scroll({
                    top: el.scrollHeight,
                    behavior: 'smooth'
                });
            }, 1);
        }
    };
    const handleItemClick = (index: number, item: listItem) => {
        setActiveListItemIndex(index);
        setActiveListItem(item);
    };
    const onTabClick = (index: number) => {
        setActiveTab(index);
        if (index === 0) {
            setListItems([
                { image: '/demo/images/dashboard/sneaker.png', text: 'Red Sneakers', subtext: 'RX Series', ratio: '+40%' },
                { image: '/demo/images/dashboard/headphones.png', text: 'HF Headphones', subtext: 'Wireless', ratio: '+24%' },
                { image: '/demo/images/dashboard/sunglasses.png', text: 'Sunglasses', subtext: 'UV Protection', ratio: '+17%' }
            ]);
        } else if (index === 1) {
            setListItems([
                { image: '/demo/images/dashboard/camera.png', text: 'Instant Camera', subtext: 'II-Mark', ratio: '+27%' },
                { image: '/demo/images/dashboard/cupcake.png', text: 'Cupcake', subtext: 'Cinnamon', ratio: '+41%' },
                { image: '/demo/images/dashboard/drink.png', text: 'Cold Drink', subtext: 'Lime', ratio: '+56%' }
            ]);
        } else if (index === 2) {
            setListItems([
                { image: '/demo/images/dashboard/tripod.png', text: 'Tripod', subtext: 'Stabilizer', ratio: '+34%' },
                { image: '/demo/images/dashboard/headphone2.png', text: 'Headphone', subtext: 'Wireless', ratio: '+67%' },
                { image: '/demo/images/dashboard/spoon.png', text: 'Spoon Set', subtext: 'Colorful', ratio: '+8%' }
            ]);
        }
    };
    const dropdownAction = (e: DropdownChangeEvent) => {
        setSelectedOrderWeek(e.value);
        recentSales(e.value.code);
    };
    const imageTemplate = (rowData: Demo.Product) => {
        var src = '/demo/images/product/' + rowData.image;
        return <img src={src} alt={rowData.brand as string} width="50px" className="shadow-4" />;
    };

    const nameTemplate = (rowData: Demo.Product) => {
        return <>{rowData.name}</>;
    };

    const categoryTemplate = (data: Demo.Product) => {
        return <>{data.category}</>;
    };
    const priceTemplate = (data: Demo.Product) => {
        return <td>{data.price}</td>;
    };

    const bodyTemplate = () => {
        return <Button type="button" icon="pi pi-search" className="p-button-text"></Button>;
    };

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-3 gap-3">
                        <div className="flex align-items-center">
                            <img src="/demo/images/avatar/profile.jpg" width={64} alt="profile" className="border-circle border-2 border-primary flex-shrink-0" />
                            <div className="ml-3">
                                <span className="text-4xl font-light">
                                    Bonjour, <span className="font-normal">Hermione</span>
                                </span>
                                <div className="text-color-secondary">26 January 2023, Thu</div>
                            </div>
                        </div>
                        <div className="flex align-items-center justify-content-between gap-3">
                            <Dropdown options={analytics} value={selectedDrop} onChange={(e) => setSelectedDrop(e.value)} placeholder="Category" className="w-full sm:w-10rem" optionLabel="label"></Dropdown>
                            <Calendar value={dates} onChange={(e: any) => setDates(e.value as any)} showIcon={true} selectionMode="range" className="w-full sm:w-14rem" placeholder="Select Range"></Calendar>
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <div className="card p-0 grid grid-nogutter">
                        <div className="col-12 md:col-6 lg:col-3 py-5 px-6 border-none md:border-right-1 surface-border">
                            <div className="flex align-items-center mb-3">
                                <Avatar icon="pi pi-shopping-cart" size="large" shape="circle" className="text-base bg-indigo-100 text-indigo-700"></Avatar>
                                <span className="text-xl ml-2">Orders</span>
                            </div>
                            <div className="flex align-items-center justify-content-between mb-3">
                                <span className="block font-bold text-6xl mb-3">1420</span>
                                <div className="flex align-items-center justify-content-between h-2rem px-2 py-1 bg-green-100 text-green-900 border-round">
                                    <i className="pi pi-arrow-up-right"></i>
                                    <span className="font-bold ml-1">551</span>
                                </div>
                            </div>
                            <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                <div className="h-full bg-indigo-500" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3 py-5 px-6 border-none md:border-right-1 surface-border">
                            <div className="flex align-items-center mb-3">
                                <Avatar icon="pi pi-money-bill" size="large" shape="circle" className="text-base bg-green-100 text-green-700"></Avatar>
                                <span className="text-xl ml-2">Revenue</span>
                            </div>
                            <div className="flex align-items-center justify-content-between mb-3">
                                <span className="block font-bold text-6xl mb-3">1420</span>
                                <div className="flex align-items-center justify-content-between h-2rem px-2 py-1 bg-green-100 text-green-900 border-round">
                                    <i className="pi pi-arrow-up-right"></i>
                                    <span className="font-bold ml-1">2.7K</span>
                                </div>
                            </div>
                            <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                <div className="h-full bg-green-500" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3 py-5 px-6 border-none md:border-right-1 surface-border">
                            <div className="flex align-items-center mb-3">
                                <Avatar icon="pi pi-users" size="large" shape="circle" className="text-base bg-yellow-100 text-yellow-700"></Avatar>
                                <span className="text-xl ml-2">Customers</span>
                            </div>
                            <div className="flex align-items-center justify-content-between mb-3">
                                <span className="block font-bold text-6xl mb-3">1420</span>
                                <div className="flex align-items-center justify-content-between h-2rem px-2 py-1 bg-green-100 text-green-900 border-round">
                                    <i className="pi pi-arrow-up-right"></i>
                                    <span className="font-bold ml-1">254</span>
                                </div>
                            </div>
                            <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                <div className="h-full bg-yellow-500" style={{ width: '80%' }}></div>
                            </div>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3 py-5 px-6">
                            <div className="flex align-items-center mb-3">
                                <Avatar icon="pi pi-comments" size="large" shape="circle" className="text-base bg-purple-100 text-purple-700"></Avatar>
                                <span className="text-xl ml-2">Comments</span>
                            </div>
                            <div className="flex align-items-center justify-content-between mb-3">
                                <span className="block font-bold text-6xl mb-3">1420</span>
                                <div className="flex align-items-center justify-content-between h-2rem px-2 py-1 bg-green-100 text-green-900 border-round">
                                    <i className="pi pi-arrow-up-right"></i>
                                    <span className="font-bold ml-1">85</span>
                                </div>
                            </div>
                            <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                <div className="h-full bg-purple-500" style={{ width: '30%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 lg:col-6">
                    <div className="card h-full">
                        <h5>Store Overview</h5>
                        <div className="flex flex-wrap gap-5">
                            <ul className="flex-1 list-none p-0 m-0">
                                {listItems.map((item: any, i: number) => (
                                    <li
                                        key={i}
                                        className={classNames('border-round p-3 flex cursor-pointer border-1 border-transparent', {
                                            'border-primary-500': activeListItemIndex === i,
                                            'hover:surface-hover': activeListItemIndex !== i
                                        })}
                                        onClick={() => handleItemClick(i, item)}
                                    >
                                        <img src={item.image} width="64" className="mr-3 border-round" />
                                        <div className="flex-1 flex align-items-center justify-content-between">
                                            <div className="flex flex-column">
                                                <span className="font-bold">{item.text}</span>
                                                <span className="var(--text-color-secondary) mb-1">{item.subtext}</span>
                                                <Badge value={item.ratio}></Badge>
                                            </div>
                                            <i className="pi pi-chevron-right text-color-secondary ml-3"></i>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex-1 flex flex-column align-items-center justify-content-center">
                                <div className="bars flex align-items-end mb-4">
                                    <div className={classNames('w-1rem h-2rem mr-2 surface-200 border-round', { 'h-3rem bg-primary-500': activeListItemIndex === 2 && activeTab === 0 })}></div>
                                    <div className={classNames('w-1rem h-3rem mr-2 surface-200 border-round', { 'h-5rem bg-primary-500': activeListItemIndex === 1 && activeTab !== 2 })}></div>
                                    <div className="w-1rem h-4rem mr-2 surface-200 border-round"></div>
                                    <div className={classNames('w-1rem h-6rem mr-2 surface-200 border-round', { 'h-4rem bg-primary-500': activeListItemIndex === 2 && activeTab !== 0 })}></div>
                                    <div className={classNames('w-1rem h-2rem mr-2 surface-200 border-round', { 'h-4rem bg-primary-500': activeListItemIndex === 1 && activeTab === 2 })}></div>
                                    <div className={classNames('w-1rem h-5rem mr-2 surface-200 border-round', { 'h-4rem bg-primary-500': activeListItemIndex === 0 && activeTab === 1 })}></div>
                                    <div className={classNames('w-1rem h-3rem mr-2 surface-200 border-round', { 'h-4rem bg-primary-500': activeListItemIndex === 0 && activeTab !== 1 })}></div>
                                    <div className="w-1rem h-1rem mr-2 surface-200 border-round"></div>
                                </div>
                                <span className="font-bold">{activeListItem.text}</span>
                                <span className="text-color-secondary">{activeListItem.subtext}</span>
                            </div>
                        </div>
                        <div className="flex align-items-center mt-7 border-round">
                            <div
                                className={classNames('flex flex-column align-items-center flex-1 py-3 cursor-pointer border-top-1 hover:surface-hover', { 'border-primary-500': activeTab === 0, 'surface-border': activeTab !== 0 })}
                                onClick={() => onTabClick(0)}
                            >
                                <i className="pi pi-sort-amount-down text-2xl mb-2"></i>
                                <span className="font-bold">Latest</span>
                            </div>
                            <div
                                className={classNames('flex flex-column align-items-center flex-1 py-3 cursor-pointer border-top-1 hover:surface-hover', { 'border-primary-500': activeTab === 1, 'surface-border': activeTab !== 1 })}
                                onClick={() => onTabClick(1)}
                            >
                                <i className="pi pi-chart-line text-2xl mb-2"></i>
                                <span className="font-bold">Trending</span>
                            </div>
                            <div
                                className={classNames('flex flex-column align-items-center flex-1 py-3 cursor-pointer border-top-1 hover:surface-hover', { 'border-primary-500': activeTab === 2, 'surface-border': activeTab !== 2 })}
                                onClick={() => onTabClick(2)}
                            >
                                <i className="pi pi-star text-2xl mb-2"></i>
                                <span className="font-bold">Starred</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 lg:col-6">
                    <div className="card h-full">
                        <div className="flex flex-wrap align-items-center justify-content-between mb-3 gap-3">
                            <h5 className="m-0">Recent Sales</h5>
                            <Dropdown options={orderWeek} value={selectedOrderWeek} onChange={(e) => dropdownAction(e)} optionLabel="name" className="w-10rem"></Dropdown>
                        </div>

                        <DataTable value={products} rows={5} responsiveLayout="scroll">
                            <Column body={imageTemplate} header="Image"></Column>
                            <Column body={nameTemplate} field="name" header="Name" sortable={true}></Column>
                            <Column body={categoryTemplate} field="category" header="Category" sortable={true}></Column>
                            <Column body={priceTemplate} field="price" header="Price" sortable={true}></Column>
                            <Column body={bodyTemplate}></Column>
                        </DataTable>
                    </div>
                </div>

                <div className="col-12 md:col-6 xl:col-6">
                    <div className="card h-full">
                        <h5>Live Support</h5>
                        <div>
                            <ul ref={chatcontainer} className="chat-container list-none p-0 px-3 mt-4 mb-6 h-21rem overflow-y-auto">
                                {chatMessages.map((chartMessage, i) => {
                                    return (
                                        <li className={`flex align-items-start mb-3 ${chartMessage.self ? 'justify-content-end' : 'justify-content-start'}`} key={i}>
                                            {!chartMessage.self && <img src={chartMessage.url} width="36" height="36" className="border-circle" alt="chat-alt" />}
                                            {!chartMessage.self && (
                                                <div className="ml-2 flex flex-column align-items-start">
                                                    <div>
                                                        <span className="font-bold mr-3">{chartMessage.from}</span>
                                                        <span className="text-color-secondary">2m ago</span>
                                                    </div>
                                                    {chartMessage.messages.map((message, messageIndex) => (
                                                        <div key={messageIndex} className="inline-block text-left surface-100 border-round px-5 py-3 mt-3">
                                                            {message}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {chartMessage.self && (
                                                <div className="mr-3 flex flex-column align-items-end">
                                                    <div>
                                                        <span className="text-color-secondary">2m ago</span>
                                                        <span className="font-bold ml-3">{chartMessage.from}</span>
                                                    </div>
                                                    {chartMessage.messages.map((message, messageIndex) => (
                                                        <div key={messageIndex} className="inline-block text-right bg-primary-500 text-primary-50 border-round px-5 py-3 mt-3">
                                                            {message}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {chartMessage.self && <img src={chartMessage.url} width="36" height="36" className="border-circle" alt="avatar" />}
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="p-inputgroup mt-3">
                                <InputText type="text" placeholder="Write your message (Hint: 'PrimeReact')" onKeyDown={onChatKeydown} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col-6 xl:col-3">
                    <div className="card h-full">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <h5 className="m-0">Revenue Stream</h5>
                            <div className="flex align-items-center gap-2">
                                <Button type="button" icon="pi pi-angle-left" rounded outlined className=" p-button-plain h-2rem w-2rem p-0"></Button>
                                <Button type="button" icon="pi pi-angle-right" rounded outlined className=" p-button-plain h-2rem w-2rem p-0"></Button>
                            </div>
                        </div>
                        <div className="flex flex-column align-items-center justify-content-center">
                            <Chart type="doughnut" data={revenueChart} options={revenueOptions} width="180" height="180" className="mb-5"></Chart>
                            <span className="font-bold mb-2">Total Revenue This Week</span>
                            <span className="font-bold text-6xl mb-2">88k</span>
                            <span className="font-bold mb-4 text-green-500">
                                +21%<span className="text-color-secondary"> higher than last week</span>
                            </span>
                            <div className="flex align-items-center justify-content-center gap-3">
                                <div className="flex align-items-center">
                                    <i className="pi pi-circle-on text-indigo-500"></i>
                                    <span className="text-color-secondary ml-2">Online</span>
                                </div>
                                <div className="flex align-items-center">
                                    <i className="pi pi-circle-on text-teal-500"></i>
                                    <span className="text-color-secondary ml-2">Retail</span>
                                </div>
                                <div className="flex align-items-center">
                                    <i className="pi pi-circle-on text-purple-500"></i>
                                    <span className="text-color-secondary ml-2">Partner</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col-6 lg:col-3">
                    <div className="card h-full">
                        <h5>Sales Channels</h5>

                        <ul className="list-none m-0 p-0">
                            <li className="mb-4">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold">Online Marketplaces</span>
                                    <span>%40</span>
                                </div>
                                <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                    <div className="h-full bg-orange-500" style={{ width: '40%' }}></div>
                                </div>
                            </li>
                            <li className="mb-4">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold">Resellers</span>
                                    <span>%60</span>
                                </div>
                                <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                    <div className="h-full bg-indigo-500" style={{ width: '60%' }}></div>
                                </div>
                            </li>
                            <li className="mb-4">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold">Affiliate</span>
                                    <span>%90</span>
                                </div>
                                <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                    <div className="h-full bg-blue-500" style={{ width: '90%' }}></div>
                                </div>
                            </li>
                            <li className="mb-4">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold">Organic</span>
                                    <span>%50</span>
                                </div>
                                <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                    <div className="h-full bg-green-500" style={{ width: '50%' }}></div>
                                </div>
                            </li>
                            <li className="mb-4">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold">Referral</span>
                                    <span>%30</span>
                                </div>
                                <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                    <div className="h-full bg-purple-500" style={{ width: '30%' }}></div>
                                </div>
                            </li>
                            <li className="mb-4">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold">Ads</span>
                                    <span>%30</span>
                                </div>
                                <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                    <div className="h-full bg-yellow-500" style={{ width: '45%' }}></div>
                                </div>
                            </li>
                            <li>
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold">Partners</span>
                                    <span>%30</span>
                                </div>
                                <div className="border-round overflow-hidden surface-200" style={{ height: '0.5rem' }}>
                                    <div className="h-full bg-teal-500" style={{ width: '70%' }}></div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="col-12 md:col-6 xl:col-3">
                    <div className="card p-0">
                        <img src="/demo/images/dashboard/bg-product.jpg" alt="blog-bg" className="w-full border-round-top-2xl" />
                        <div className="p-4">
                            <div className="flex align-items-center justify-content-between mb-3">
                                <div className="inline-flex align-items-center">
                                    <span className="font-bold">Optimizing Logistics with AI</span>
                                    <i className="pi pi-check-circle ml-3 text-xl text-green-500"></i>
                                </div>
                                <i className="pi pi-bookmark ml-3 text-xl text-color-secondary"></i>
                            </div>
                            <p className="mb-5 line-height-3">Sit amet nulla facilisi morbi tempus iaculis. Dolor magna eget est lorem ipsum dolor sit. Turpis egestas pretium aenean pharetra magna ac placerat vestibulum lectus.</p>
                            <div className="flex align-items-center justify-content-between">
                                <img src="/demo/images/avatar/amyelsner.png" alt="avatar" className="flex-shrink-0 w-2rem h-2rem" />
                                <div className="text-color-secondary flex align-items-center">
                                    <i className="pi pi-heart mr-1"></i>
                                    <span>888</span>
                                    <i className="pi pi-eye ml-4 mr-1"></i>
                                    <span>8888</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col-6 xl:col-3">
                    <div className="card h-full">
                        <h5>Best Sellers</h5>
                        <ul className="list-none p-0 m-0">
                            <li className="flex align-items-center justify-content-between pb-2">
                                <div className="flex align-items-center justify-content-between">
                                    <img src="/demo/images/product/bamboo-watch.png" alt="verona-layout" className="w-3rem h-3rem border-round" />
                                    <div className="ml-2 flex flex-column">
                                        <span className="font-bold">Bamboo Watch</span>
                                        <span className="text-color-secondary text-sm">Accessories</span>
                                    </div>
                                </div>
                                <Knob value={value1} size={40} className="ml-auto" showValue={false}></Knob>
                            </li>
                            <li className="flex align-items-center justify-content-between py-2">
                                <div className="flex align-items-center justify-content-between">
                                    <img src="/demo/images/product/black-watch.png" alt="verona-layout" width="42" height="42" className="border-round" />
                                    <div className="ml-2 flex flex-column">
                                        <span className="font-bold">Black Watch</span>
                                        <span className="text-color-secondary text-sm">Accessories</span>
                                    </div>
                                </div>
                                <Knob value={value2} size={40} className="ml-auto" showValue={false}></Knob>
                            </li>
                            <li className="flex align-items-center justify-content-between py-2">
                                <div className="flex align-items-center justify-content-between">
                                    <img src="/demo/images/product/blue-band.png" alt="verona-layout" width="42" height="42" className="border-round" />
                                    <div className="ml-2 flex flex-column">
                                        <span className="font-bold">Blue Band</span>
                                        <span className="text-color-secondary text-sm">Fitness</span>
                                    </div>
                                </div>
                                <Knob value={value3} size={40} className="ml-auto" showValue={false}></Knob>
                            </li>
                            <li className="flex align-items-center justify-content-between py-2">
                                <div className="flex align-items-center justify-content-between">
                                    <img src="/demo/images/product/blue-t-shirt.png" alt="verona-layout" width="42" height="42" className="border-round" />
                                    <div className="ml-2 flex flex-column">
                                        <span className="font-bold">Blue T-Shirt</span>
                                        <span className="text-color-secondary text-sm">Clothing</span>
                                    </div>
                                </div>
                                <Knob value={value4} size={40} className="ml-auto" showValue={false}></Knob>
                            </li>
                            <li className="flex align-items-center justify-content-between py-2">
                                <div className="flex align-items-center justify-content-between">
                                    <img src="/demo/images/product/black-watch.png" alt="verona-layout" width="42" height="42" className="border-round" />
                                    <div className="ml-2 flex flex-column">
                                        <span className="font-bold">Black Watch</span>
                                        <span className="text-color-secondary text-sm">Accessories</span>
                                    </div>
                                </div>
                                <Knob value={value5} size={40} className="ml-auto" showValue={false}></Knob>
                            </li>
                            <li className="flex align-items-center justify-content-between py-2">
                                <div className="flex align-items-center justify-content-between">
                                    <img src="/demo/images/product/sneakers.jpg" alt="verona-layout" width="42" height="42" className="border-round" />
                                    <div className="ml-2 flex flex-column">
                                        <span className="font-bold">Sneakers</span>
                                        <span className="text-color-secondary text-sm">Clothing</span>
                                    </div>
                                </div>
                                <Knob value={value6} size={40} className="ml-auto" showValue={false}></Knob>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="col-12 md:col-6 lg:col-6">
                    <div className="card">
                        <h5>Customer Stories</h5>
                        <div className="flex flex-wrap align-items-center justify-content-around gap-2">
                            <div className="flex flex-column align-items-center justify-content-center">
                                <Button icon="pi pi-plus text-2xl" outlined rounded className="w-4rem h-4rem mb-2"></Button>
                                <span className="font-bold text-sm">Add New</span>
                            </div>
                            <div className="flex flex-column align-items-center justify-content-center">
                                <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
                                    <img src="/demo/images/avatar/amyelsner.png" className="border-circle h-3rem w-3rem" alt="avatar" />
                                    <span className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center" style={{ right: '-0.75rem', width: '1.5rem', height: '1.5rem' }}>
                                        <i className="pi pi-globe text-sm"></i>
                                    </span>
                                </div>
                                <span className="font-bold">Darlene Robertson</span>
                                <span className="text-color-secondary text-sm">2m ago</span>
                            </div>
                            <div className="flex flex-column align-items-center justify-content-center">
                                <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
                                    <img src="/demo/images/avatar/annafali.png" className="border-circle h-3rem w-3rem" alt="avatar" />
                                    <span className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center" style={{ right: '-0.75rem', width: '1.5rem', height: '1.5rem' }}>
                                        <i className="pi pi-globe text-sm"></i>
                                    </span>
                                </div>
                                <span className="font-bold">Albert Flores</span>
                                <span className="text-color-secondary text-sm">1h ago</span>
                            </div>
                            <div className="flex flex-column align-items-center justify-content-center">
                                <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
                                    <img src="/demo/images/avatar/asiyajavayant.png" className="border-circle h-3rem w-3rem" alt="avatar" />
                                    <span className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center" style={{ right: '-0.75rem', width: '1.5rem', height: '1.5rem' }}>
                                        <i className="pi pi-globe text-sm"></i>
                                    </span>
                                </div>
                                <span className="font-bold">Annette Black</span>
                                <span className="text-color-secondary text-sm">6m ago</span>
                            </div>
                            <div className="flex flex-column align-items-center justify-content-center">
                                <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
                                    <img src="/demo/images/avatar/bernardodominic.png" className="border-circle h-3rem w-3rem" alt="avatar" />
                                    <span className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center" style={{ right: '-0.75rem', width: '1.5rem', height: '1.5rem' }}>
                                        <i className="pi pi-globe text-sm"></i>
                                    </span>
                                </div>
                                <span className="font-bold">Ralph Edwards</span>
                                <span className="text-color-secondary text-sm">4m ago</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h5>Potential Influencers</h5>
                        <div className="flex flex-wrap align-items-center justify-content-around gap-2">
                            <div className="flex flex-column align-items-center justify-content-center">
                                <Button icon="pi pi-plus text-2xl" className="w-4rem h-4rem p-button-outlined p-button-rounded mb-2"></Button>
                                <span className="font-bold text-sm">Add New</span>
                            </div>
                            <div className="flex flex-column align-items-center justify-content-center">
                                <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
                                    <img src="/demo/images/avatar/ionibowcher.png" className="border-circle h-3rem w-3rem" alt="avatar" />
                                    <span className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center" style={{ right: '-0.75rem', width: '1.5rem', height: '1.5rem' }}>
                                        <i className="pi pi-globe text-sm"></i>
                                    </span>
                                </div>
                                <span className="font-bold">Jenna Watson</span>
                                <span className="text-color-secondary text-sm">2m ago</span>
                            </div>
                            <div className="flex flex-column align-items-center justify-content-center">
                                <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
                                    <img src="/demo/images/avatar/onyamalimba.png" className="border-circle h-3rem w-3rem" alt="avatar" />
                                    <span className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center" style={{ right: '-0.75rem', width: '1.5rem', height: '1.5rem' }}>
                                        <i className="pi pi-globe text-sm"></i>
                                    </span>
                                </div>
                                <span className="font-bold">Dan Cooper</span>
                                <span className="text-color-secondary text-sm">10m ago</span>
                            </div>
                            <div className="flex flex-column align-items-center justify-content-center">
                                <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
                                    <img src="/demo/images/avatar/elwinsharvill.png" className="border-circle h-3rem w-3rem" alt="avatar" />
                                    <span className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center" style={{ right: '-0.75rem', width: '1.5rem', height: '1.5rem' }}>
                                        <i className="pi pi-globe text-sm"></i>
                                    </span>
                                </div>
                                <span className="font-bold">Kathryn Murphy</span>
                                <span className="text-color-secondary text-sm">50m ago</span>
                            </div>
                            <div className="flex flex-column align-items-center justify-content-center">
                                <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
                                    <img src="/demo/images/avatar/stephenshaw.png" className="border-circle h-3rem w-3rem" alt="avatar" />
                                    <span className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center" style={{ right: '-0.75rem', width: '1.5rem', height: '1.5rem' }}>
                                        <i className="pi pi-globe text-sm"></i>
                                    </span>
                                </div>
                                <span className="font-bold">Smith Wilson</span>
                                <span className="text-color-secondary text-sm">40m ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default DashboardSales;
