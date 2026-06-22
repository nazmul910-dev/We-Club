import QueryBuilder from "../../utility/queryBuilder";
import { IUser } from "./user.interface";
import User from "./users.model.schema";


const getAllUsersFromDB  = async (query: any) => {

    const { limit, skip , sort, search } = query; // Destructure any query parameters if needed

    const queryBuilder = new QueryBuilder<IUser>(User.find().select("-password"), query).search(["name", "email"]).filter().sort().paginate();
    
    const users = await queryBuilder.modelQuery;
    return users;
}

export const userService = { getAllUsersFromDB };