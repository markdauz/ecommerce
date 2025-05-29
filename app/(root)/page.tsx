import sampleData from "@/db/sample-data";
import ProductList from "@/components/shared/product/product-list";
const Home = () => {
  return (<>
    <ProductList data={sampleData.products} title='Featured Products' limit={4} />
  </>);
}

export default Home;